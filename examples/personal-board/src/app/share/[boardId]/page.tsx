import { getPublicBoard } from "@/lib/actions"
import Whiteboard from "@/components/Whiteboard"
import { notFound } from "next/navigation"

interface PageProps {
    params: {
        boardId: string
    }
}

export default async function PublicSharePage({ params }: PageProps) {
    const { boardId } = params
    const board = await getPublicBoard(boardId)

    if (!board) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h1 className="text-2xl font-bold">Private or Not Found</h1>
                <p>This board is private or does not exist.</p>
            </div>
        )
    }

    return (
        <div className="h-screen w-full flex flex-col">
            <header className="h-14 border-b flex items-center px-6 bg-muted/40 justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">E</span>
                    </div>
                    <span className="font-semibold text-sm md:text-base">{board.title} (Read Only)</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    Powered by EPad
                </div>
            </header>
            <div className="flex-1 w-full border-t relative">
                <Whiteboard
                    boardId={boardId}
                    initialData={board.content}
                    viewMode={true}
                />
            </div>
        </div>
    )
}
