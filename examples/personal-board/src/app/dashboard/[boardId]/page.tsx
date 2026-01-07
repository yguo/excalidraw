import { getBoard } from "@/lib/actions"
import Whiteboard from "@/components/Whiteboard"
import { notFound } from "next/navigation"
import { ShareButton } from "@/components/ShareButton"

interface PageProps {
    params: {
        boardId: string
    }
}

export default async function BoardPage({ params }: PageProps) {
    const { boardId } = params
    const board = await getBoard(boardId)

    if (!board) {
        return notFound()
    }

    return (
        <div className="flex flex-col h-[calc(100vh-1rem)] gap-2">
            <div className="flex items-center justify-between px-2">
                <h1 className="text-lg font-semibold">{board.title}</h1>
                <ShareButton boardId={boardId} initialPublic={board.isPublic} />
            </div>
            <div className="flex-1 w-full border rounded-lg overflow-hidden relative">
                <Whiteboard
                    boardId={boardId}
                    initialData={board.content}
                />
            </div>
        </div>
    )
}
