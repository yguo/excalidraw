import fs from "fs/promises"
import path from "path"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

const DATA_DIR = path.join(process.cwd(), "data", "boards")

// Ensure data dir exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR)
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true })
    }
}

export async function saveBoardData(boardId: string, data: any) {
    // If no R2 creds, use local FS
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
        await ensureDataDir()
        await fs.writeFile(path.join(DATA_DIR, `${boardId}.json`), JSON.stringify(data))
        return
    }

    // TODO: Implement R2 Logic
    console.warn("R2 storage not fully implemented yet, falling back to FS logic or no-op if env vars set but unimplemented")
}

export async function getBoardData(boardId: string) {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
        try {
            const data = await fs.readFile(path.join(DATA_DIR, `${boardId}.json`), "utf-8")
            return JSON.parse(data)
        } catch {
            return null
        }
    }
    return null
}
