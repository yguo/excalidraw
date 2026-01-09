"use server"

import { db } from "@/db"
import { boards } from "@/db/schema"
import { auth } from "@/auth"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

// Note: Postgres adapter returns arrays, so we destructure [result] instead of .get()

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



export async function saveBoard(id: string, elements: any, appState: any, files: any) {
    const session = await auth()
    if (!session?.user?.email) return





    // Check ownership
    const [board] = await db.select().from(boards).where(eq(boards.id, id))
    if (!board) {

        return
    }

    // Update DB
    // Maxwell: Upload files to Vercel Blob if they are Data URLs
    if (files) {
        const uploadPromises = Object.keys(files).map(async (key) => {
            const file = files[key];
            if (file.dataURL && file.dataURL.startsWith("data:image/")) {
                try {
                    const { put } = await import("@vercel/blob");
                    // Extract base64
                    const base64Data = file.dataURL.split(',')[1];
                    const buffer = Buffer.from(base64Data, 'base64');
                    // Generate filename
                    const ext = file.mimeType.split('/')[1] || 'bin';
                    const filename = `${file.id}.${ext}`;

                    const blob = await put(filename, buffer, {
                        access: 'public',
                    });

                    file.dataURL = blob.url;
                } catch (error) {
                    console.error(`Failed to upload file ${file.id} to blob:`, error);
                    // Keep original dataURL if upload fails
                }
            }
        });
        await Promise.all(uploadPromises);
    }

    // Update DB
    try {

        await db.update(boards).set({
            elements,
            appState,
            files,
            updatedAt: new Date()
        }).where(eq(boards.id, id))

    } catch (e) {
        console.error(e)
    }

    revalidatePath(`/dashboard/${id}`)
    revalidatePath("/dashboard")
}

export async function getBoard(id: string) {
    const session = await auth()

    // Load full board from DB
    const [board] = await db.select().from(boards).where(eq(boards.id, id))

    if (!board) {
        return null
    }

    // Helper to construct "content" object expected by UI similar to old storage format
    const content = {
        elements: board.elements,
        appState: board.appState,
        files: board.files
    }

    // Return combined object. Note: UI might expect { ...board, content: { ... } } or flattened.
    // Previous code: return { ...board, content }
    return { ...board, content }
}

export async function toggleShare(id: string) {
    const session = await auth()
    if (!session?.user?.email) return

    const [board] = await db.select().from(boards).where(eq(boards.id, id))
    if (!board) return

    const newValue = !board.isPublic
    await db.update(boards).set({ isPublic: newValue }).where(eq(boards.id, id))
    revalidatePath(`/dashboard/${id}`)
    return newValue
}

export async function getPublicBoard(id: string) {
    const [board] = await db.select().from(boards).where(eq(boards.id, id))
    if (!board || !board.isPublic) return null

    const content = {
        elements: board.elements,
        appState: board.appState,
        files: board.files
    }
    return { ...board, content }
}



export async function updateBoardTitle(id: string, title: string) {
    const session = await auth()
    if (!session?.user?.email) return

    const [board] = await db.select().from(boards).where(eq(boards.id, id))
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
    if (!session?.user?.email) {

        return []
    }

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email))

    return user?.libraryItems || []
}

export async function saveLibrary(libraryItems: any) {

    const session = await auth()
    if (!session?.user?.email) {

        return
    }



    // Maxwell: Fix - Use UPSERT to ensure user exists.
    // Local dev DB might be empty, preventing UPDATE from working.
    // Maxwell: Enforce status="unpublished" for personal library items
    const starttizedItems = Array.isArray(libraryItems)
        ? libraryItems.map((item: any) => ({ ...item, status: "unpublished" }))
        : [];

    await db.insert(users).values({
        email: session.user.email,
        name: session.user.name || "User",
        image: session.user.image,
        libraryItems: starttizedItems
    }).onConflictDoUpdate({
        target: users.email,
        set: { libraryItems: starttizedItems }
    })
}
