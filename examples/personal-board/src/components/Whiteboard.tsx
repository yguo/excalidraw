"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { saveBoard } from "@/lib/actions"
import { useDebouncedCallback } from "use-debounce"
import { Loader2 } from "lucide-react"

// Dynamic import for Excalidraw
const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
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

    // Debounced save
    const debouncedSave = useDebouncedCallback(async (elements, appState) => {
        if (viewMode) return
        await saveBoard(boardId, elements, appState)
    }, 1000)

    const onChange = (elements: any, appState: any) => {
        debouncedSave(elements, appState)
    }

    return (
        <div className="h-screen w-full">
            <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                initialData={{
                    elements: initialData?.elements || [],
                    appState: {
                        ...initialData?.appState,
                        viewModeEnabled: viewMode,
                        collaborators: []
                    },
                    scrollToContent: true
                }}
                onChange={onChange}
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
