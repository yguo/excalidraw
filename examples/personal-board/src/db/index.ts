import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "@vercel/postgres";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Determine if we are in a Vercel environment or Local
const isVercel = process.env.POSTGRES_URL?.includes("vercel-storage");

let db: any; // Type inference slightly different between adapters

if (isVercel) {
    // Vercel Postgres
    db = drizzleVercel(sql, { schema });
} else {
    // Local Docker Postgres
    if (!process.env.POSTGRES_URL) {
        throw new Error("POSTGRES_URL is not defined");
    }

    // Singleton pattern to prevent connection exhaustion in dev
    const globalForDb = global as unknown as { conn: Pool | undefined };

    const pool = globalForDb.conn ?? new Pool({
        connectionString: process.env.POSTGRES_URL,
    });

    if (process.env.NODE_ENV !== "production") {
        globalForDb.conn = pool;
    }

    db = drizzle(pool, { schema });
}

export { db };
// In production, we would use Cloudflare D1.
