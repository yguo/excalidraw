"use client"

import { Button } from "@/components/ui/button"
import { toggleShare } from "@/lib/actions"
import { Share2, Globe, Lock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ShareButton({ boardId, initialPublic }: { boardId: string, initialPublic: boolean | null }) {
    const [isPublic, setIsPublic] = useState(!!initialPublic)
    const [open, setOpen] = useState(false)

    // Check if window is defined for SSR safety
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const shareUrl = `${origin}/share/${boardId}`

    const handleToggle = async () => {
        try {
            const newVal = await toggleShare(boardId)
            setIsPublic(!!newVal)
            toast.success(newVal ? "Board is now public" : "Board is now private")
        } catch (e) {
            toast.error("Failed to update settings")
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        toast.success("Link copied to clipboard")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Board</DialogTitle>
                    <DialogDescription>
                        Anyone with the link can view this board.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={isPublic ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={handleToggle}
                        >
                            {isPublic ? <Globe className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                            {isPublic ? "Public Access Enabled" : "Private Access Only"}
                        </Button>
                    </div>

                    {isPublic && (
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={shareUrl}
                                    readOnly
                                />
                            </div>
                            <Button type="button" size="sm" className="px-3" onClick={copyLink}>
                                <span className="sr-only">Copy</span>
                                Copy
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
