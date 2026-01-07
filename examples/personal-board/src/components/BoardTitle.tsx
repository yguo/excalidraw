"use client"

import { useState, useRef, useEffect } from "react"
import { updateBoardTitle } from "@/lib/actions"
import { Input } from "@/components/ui/input"

interface BoardTitleProps {
    boardId: string
    initialTitle: string
}

export function BoardTitle({ boardId, initialTitle }: BoardTitleProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(initialTitle)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleSave = async () => {
        setIsEditing(false)
        if (title.trim() === "" || title === initialTitle) {
            setTitle(initialTitle)
            return
        }
        await updateBoardTitle(boardId, title)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave()
        } else if (e.key === "Escape") {
            setIsEditing(false)
            setTitle(initialTitle)
        }
    }

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-8 text-lg font-semibold w-[200px] md:w-[300px]"
            />
        )
    }

    return (
        <h1
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-border"
        >
            {title}
        </h1>
    )
}
