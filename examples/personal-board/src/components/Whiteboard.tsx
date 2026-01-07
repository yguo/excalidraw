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
}

export default function Whiteboard({ boardId, initialData, viewMode = false, serverUpdatedAt = 0 }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)

    // Load library on mount (and check for hash import)
    useEffect(() => {
        if (!excalidrawAPI) return

        const loadLib = async () => {
            // Maxwell: 1. Load persisted library first
            const persistedLibraryItems = await getLibrary()
            let finalLibrary = persistedLibraryItems || []

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
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to load library from hash", e)
                    }
                }
            }

            // 3. Update Excalidraw
            if (finalLibrary && Array.isArray(finalLibrary) && finalLibrary.length > 0) {
                excalidrawAPI.updateLibrary({
                    libraryItems: finalLibrary
                })
            }
            // If we imported something, we should probably save it back immediately to persistence
            // to ensure it sticks even if onLibraryChange doesn't fire immediately.
            if (finalLibrary.length > (persistedLibraryItems?.length || 0)) {
                await saveLibrary(finalLibrary)
            }
        }
        loadLib()
    }, [excalidrawAPI])

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

    // Debounced save
    const debouncedSave = useDebouncedCallback(async (elements, appState, files) => {
        if (viewMode) return

        // Sanitize all data for Server Actions to avoid serialization issues (e.g. Map/Set in appState)
        const plainFiles = JSON.parse(JSON.stringify(files || {}))
        const plainElements = JSON.parse(JSON.stringify(elements || []))
        const plainAppState = JSON.parse(JSON.stringify(appState || {}))

        await saveBoard(boardId, plainElements, plainAppState, plainFiles)
    }, 200)

    const onChange = (elements: any, appState: any, files: any) => {
        // Robustly merge files
        let currentFiles = files || {};
        if (excalidrawAPI) {
            const apiFiles = excalidrawAPI.getFiles();
            currentFiles = { ...currentFiles, ...apiFiles };
        }

        // Save to Local Storage immediately (Backup)
        try {
            const lsKey = `board-data-${boardId}`
            localStorage.setItem(lsKey, JSON.stringify({
                elements,
                appState,
                files: currentFiles,
                updatedAt: Date.now()
            }))
        } catch (e) {
            // Ignore LS errors
        }

        debouncedSave(elements, appState, currentFiles)
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
            debouncedSave.flush()
            debouncedSaveLibrary.flush()
        }
    }, [excalidrawAPI, boardId, debouncedSave])

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
