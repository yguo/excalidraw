"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { saveBoard, getLibrary, saveLibrary } from "@/lib/actions"
import { useDebouncedCallback } from "use-debounce"
import { Loader2 } from "lucide-react"

// Dynamic import for Excalidraw
const ExcalidrawWrapper = dynamic(
    async () => {
        const mod = await import("@excalidraw/excalidraw")
        return {
            default: (props: any) => {
                const { Excalidraw, MainMenu, WelcomeScreen } = mod
                return (
                    <Excalidraw {...props}>
                        <MainMenu>
                            <MainMenu.DefaultItems.LoadScene />
                            <MainMenu.DefaultItems.SaveToActiveFile />
                            <MainMenu.DefaultItems.Export />
                            <MainMenu.DefaultItems.SaveAsImage />
                            <MainMenu.DefaultItems.Help />
                            <MainMenu.DefaultItems.ClearCanvas />
                            <MainMenu.Separator />
                            <MainMenu.DefaultItems.ToggleTheme />
                            <MainMenu.DefaultItems.ChangeCanvasBackground />
                        </MainMenu>
                        <WelcomeScreen />
                    </Excalidraw>
                )
            }
        }
    },
    {
        ssr: false,
        loading: () => (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ),
    },
)

interface WhiteboardProps {
    boardId: string
    initialData: any
    viewMode?: boolean
    serverUpdatedAt?: number
    initialLibraryItems?: any
}

export default function Whiteboard({ boardId, initialData, viewMode = false, serverUpdatedAt = 0, initialLibraryItems = [] }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)

    // Load library on mount (and check for hash import)
    useEffect(() => {
        if (!excalidrawAPI) return

        const loadLib = async () => {
            // Maxwell: 1. Perist from prop is handled by initialData, but we assume it might not be enough if we want to merge?
            // Actually, initialData libraryItems REPLACES everything.
            let finalLibrary = initialLibraryItems || []

            // Maxwell: 2. Check for URL hash import
            if (typeof window !== "undefined") {
                const hash = window.location.hash
                if (hash.includes("addLibrary")) {
                    try {
                        const params = new URLSearchParams(hash.slice(1))
                        const libraryUrl = params.get("addLibrary")
                        const token = params.get("token") // Unused but part of url

                        if (libraryUrl) {
                            const decodedUrl = decodeURIComponent(libraryUrl)
                            const res = await fetch(decodedUrl)
                            if (res.ok) {
                                const blob = await res.json()
                                const importedItems = blob.libraryItems || blob.library || []
                                if (importedItems.length > 0) {
                                    // Merge with existing
                                    finalLibrary = [...finalLibrary, ...importedItems]

                                    // Clear hash
                                    window.history.replaceState(null, "", window.location.pathname)

                                    // If we imported something, update Excalidraw and persist
                                    excalidrawAPI.updateLibrary({
                                        libraryItems: finalLibrary,
                                        merge: true
                                    })
                                    await saveLibrary(finalLibrary)
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to load library from hash", e)
                    }
                }
            }
        }
        loadLib()
    }, [excalidrawAPI, initialLibraryItems])

    // Restore from Local Storage if newer
    useEffect(() => {
        if (!excalidrawAPI) return

        try {
            const lsKey = `board-data-${boardId}`
            const localDataStr = localStorage.getItem(lsKey)
            if (localDataStr) {
                const localData = JSON.parse(localDataStr)
                if (localData.updatedAt > serverUpdatedAt && localData.elements && localData.elements.length > 0) {
                    // Local data is newer, restore it

                    excalidrawAPI.updateScene({
                        elements: localData.elements,
                        appState: localData.appState,
                    })
                    if (localData.files) {
                        excalidrawAPI.addFiles(Object.values(localData.files))
                    }
                }
            }
        } catch (e) {
            console.error("Failed to restore from LS", e)
        }
    }, [excalidrawAPI, boardId, serverUpdatedAt])


    // Debounced library save
    const debouncedSaveLibrary = useDebouncedCallback(async (items) => {
        await saveLibrary(items)
    }, 200)

    const onLibraryChange = (items: any) => {
        debouncedSaveLibrary(items)
    }

    // Debounced save for Cloud (relaxed to 1000ms)
    const debouncedSaveCloud = useDebouncedCallback(async (elements, appState, files) => {
        if (viewMode) return

        // Sanitize all data for Server Actions to avoid serialization issues (e.g. Map/Set in appState)
        // Deep cloning here, OFF the main thread of user interaction (delayed)
        const plainFiles = JSON.parse(JSON.stringify(files || {}))
        const plainElements = JSON.parse(JSON.stringify(elements || []))
        const plainAppState = JSON.parse(JSON.stringify(appState || {}))

        await saveBoard(boardId, plainElements, plainAppState, plainFiles)
    }, 1000)

    // Debounced save for Local Storage (500ms - frequent enough to prevent loss, but not blocking every frame)
    const debouncedSaveLS = useDebouncedCallback((elements, appState, files, boardId) => {
        try {
            const lsKey = `board-data-${boardId}`
            localStorage.setItem(lsKey, JSON.stringify({
                elements,
                appState,
                files,
                updatedAt: Date.now()
            }))
        } catch (e) {
            // Ignore LS errors
        }
    }, 500)

    const onChange = (elements: any, appState: any, files: any) => {
        // Robustly merge files
        let currentFiles = files || {};
        if (excalidrawAPI) {
            const apiFiles = excalidrawAPI.getFiles();
            currentFiles = { ...currentFiles, ...apiFiles };
        }

        // Trigger debounced saves
        // This is FAST now - no sync I/O, no deep cloning on the critical path
        debouncedSaveLS(elements, appState, currentFiles, boardId)
        debouncedSaveCloud(elements, appState, currentFiles)
    }

    // Force save on blur / unmount
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && excalidrawAPI) {
                const elements = excalidrawAPI.getSceneElements()
                const appState = excalidrawAPI.getAppState()
                const files = excalidrawAPI.getFiles()

                // Sanitize all data for Server Actions
                const plainFiles = JSON.parse(JSON.stringify(files || {}))
                const plainElements = JSON.parse(JSON.stringify(elements || []))
                const plainAppState = JSON.parse(JSON.stringify(appState || {}))

                saveBoard(boardId, plainElements, plainAppState, plainFiles)
            }
        }
        // ... (rest is same)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            // Flush any pending debounced save on component unmount (navigation)
            debouncedSaveCloud.flush()
            debouncedSaveLS.flush()
            debouncedSaveLibrary.flush()
        }
    }, [excalidrawAPI, boardId, debouncedSaveCloud, debouncedSaveLS])

    // Pass initial files
    const initialFiles = initialData?.files || null

    return (
        <div className="h-screen w-full">
            <ExcalidrawWrapper
                excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                initialData={{
                    elements: initialData?.elements || [],
                    appState: {
                        ...initialData?.appState,
                        viewModeEnabled: viewMode,
                        collaborators: []
                    },
                    files: initialData?.files || null, // Pass files
                    libraryItems: initialLibraryItems, // Pass library items (server side)
                    scrollToContent: true
                }}
                onChange={onChange}
                onLibraryChange={onLibraryChange}
                viewModeEnabled={viewMode}
                theme="light"
                name="EPad Board"
                UIOptions={{
                    canvasActions: {
                        toggleTheme: true,
                        saveToActiveFile: false,
                        loadScene: false,
                        export: { saveFileToDisk: true },
                        saveAsImage: true,
                    }
                }}
            />
        </div>
    )
}
