"use server"

import { db } from "@/db"
import { boards } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

export async function getBoards() {
    const session = await auth()
    if (!session?.user?.email) return []
    // In real app, match by userId. 
    // Here we query all because our schema 'userId' is not strictly linked to user table yet in this logic.
    // Let's assume we store email as userId for now or use the session sub.

    // For this MVP, let's just query where userId matches email or sub?
    // The session.js strategy: "jwt". auth().user.id might be undefined depending on config.
    // We'll use email as the stable identifier for now.

    return await db.select().from(boards).where(eq(boards.userId, session.user.email)).orderBy(desc(boards.updatedAt))
}

export async function createBoard() {
    const session = await auth()
    if (!session?.user?.email) return

    const id = uuidv4()

    await db.insert(boards).values({
        id,
        userId: session.user.email,
        title: "Untitled Board",
        slug: id,
        isPublic: false,
    })

    revalidatePath("/dashboard")
    redirect(`/dashboard/${id}`)
}

export async function deleteBoard(id: string) {
    const session = await auth()
    if (!session?.user?.email) return

    await db.delete(boards).where(eq(boards.id, id))
    revalidatePath("/dashboard")
}

import { saveBoardData, getBoardData as getBoardDataStorage } from "./storage"

export async function saveBoard(id: string, elements: any, appState: any, files: any) {
    const session = await auth()
    if (!session?.user?.email) return

    // Check ownership
    // const board = await db.query.boards.findFirst(...)

    await saveBoardData(id, { elements, appState, files })

    // Update timestamp
    await db.update(boards).set({ updatedAt: new Date() }).where(eq(boards.id, id))
}

export async function getBoard(id: string) {
    const session = await auth()
    // if (!session?.user?.email) return null // Public might be allowed?

    // Check DB meta
    const board = await db.select().from(boards).where(eq(boards.id, id)).get()
    if (!board) return null

    // Load content
    const content = await getBoardDataStorage(id)
    return { ...board, content }
}

export async function toggleShare(id: string) {
    const session = await auth()
    if (!session?.user?.email) return

    const board = await db.select().from(boards).where(eq(boards.id, id)).get()
    if (!board) return

    const newValue = !board.isPublic
    await db.update(boards).set({ isPublic: newValue }).where(eq(boards.id, id))
    revalidatePath(`/dashboard/${id}`)
    return newValue
}

export async function getPublicBoard(id: string) {
    const board = await db.select().from(boards).where(eq(boards.id, id)).get()
    if (!board || !board.isPublic) return null

    // Load content
    const content = await getBoardDataStorage(id)
    return { ...board, content }
}



export async function updateBoardTitle(id: string, title: string) {
    const session = await auth()
    if (!session?.user?.email) return

    const board = await db.select().from(boards).where(eq(boards.id, id)).get()
    if (!board) return

    // Simple ownership check
    if (board.userId !== session.user.email) return

    await db.update(boards).set({ title, updatedAt: new Date() }).where(eq(boards.id, id))
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/${id}`)
}

import { users } from "@/db/schema"

export async function getLibrary() {
    const session = await auth()
    if (!session?.user?.email) return []

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).get()
    return user?.libraryItems || []
}

export async function saveLibrary(libraryItems: any) {
    const session = await auth()
    if (!session?.user?.email) return

    await db.update(users).set({ libraryItems }).where(eq(users.email, session.user.email))
}
