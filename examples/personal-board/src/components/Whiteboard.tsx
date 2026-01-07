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
}

export default function Whiteboard({ boardId, initialData, viewMode = false }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)

    // Load library on mount
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

    // Debounced library save
    const debouncedSaveLibrary = useDebouncedCallback(async (items) => {
        await saveLibrary(items)
    }, 1000)

    const onLibraryChange = (items: any) => {
        debouncedSaveLibrary(items)
    }

    // Debounced save
    const debouncedSave = useDebouncedCallback(async (elements, appState, files) => {
        if (viewMode) return
        await saveBoard(boardId, elements, appState, files)
    }, 500) // Reduced to 500ms for responsiveness

    const onChange = (elements: any, appState: any, files: any) => {
        debouncedSave(elements, appState, files)
    }

    // Force save on blur / unmount
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && excalidrawAPI) {
                const elements = excalidrawAPI.getSceneElements()
                const appState = excalidrawAPI.getAppState()
                const files = excalidrawAPI.getFiles()
                saveBoard(boardId, elements, appState, files)
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            // Check if clean up save is needed, but unmount might be too late for async server action if tab closes
        }
    }, [excalidrawAPI, boardId])

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
