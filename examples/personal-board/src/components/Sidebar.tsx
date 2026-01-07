"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Plus, Settings } from "lucide-react"
import { createBoard } from "@/lib/actions"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserMenu } from "@/components/UserMenu"

interface SidebarProps {
    user: any
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-muted/40 border-r">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">E</span>
                    </div>
                    <span className="">EPad</span>
                </Link>
                <div className="ml-auto">
                    {/* Mobile trigger could go here */}
                </div>
            </div>

            <div className="flex-1 flex flex-col pt-4">
                <div className="px-4 mb-4">
                    <form action={createBoard}>
                        <Button size="sm" className="w-full justify-start" variant="default">
                            <Plus className="mr-2 h-4 w-4" />
                            New Board
                        </Button>
                    </form>
                </div>

                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                            pathname === "/dashboard" ? "bg-muted text-primary" : "text-muted-foreground"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        My Boards
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                            pathname === "/dashboard/settings" ? "bg-muted text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>

                <div className="mt-auto p-4 border-t">
                    <div className="flex items-center gap-3">
                        <UserMenu user={user} />
                        <div className="text-sm">
                            <div className="font-medium">{user?.name}</div>
                            <div className="text-xs text-muted-foreground">Free Plan</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
