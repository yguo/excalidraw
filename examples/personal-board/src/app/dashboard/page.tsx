import { getBoards, createBoard, deleteBoard } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    const boards = await getBoards()

    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">My Boards</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                <form action={createBoard}>
                    <button className="w-full h-full text-left">
                        {/* @ts-expect-error Server Component Type Issue */}
                        <Card className="flex flex-col items-center justify-center p-6 border-dashed shadow-none hover:bg-muted/50 cursor-pointer transition-colors h-[200px]">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Plus className="h-8 w-8" />
                                <span>Create new board</span>
                            </div>
                        </Card>
                    </button>
                </form>

                {boards.map((board: any) => (
                    <Card key={board.id} className="flex flex-col h-[200px] hover:shadow-md transition-shadow relative group">
                        <Link href={`/dashboard/${board.id}`} className="flex-1">
                            <CardHeader>
                                <CardTitle className="truncate">{board.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    Edited {new Date(board.updatedAt!).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Link>
                        <CardFooter className="border-t p-2 flex justify-end">
                            <form action={deleteBoard.bind(null, board.id)}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}

            </div>
        </>
    )
}
