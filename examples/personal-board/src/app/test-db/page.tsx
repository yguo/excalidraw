import { db } from "@/db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/vercel-postgres/migrator";
import { revalidatePath } from "next/cache";
import path from "path";

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    let error: any = null;
    let rows: any[] = [];
    let host = "unknown";

    try {
        const url = process.env.POSTGRES_URL || "";
        host = url; // Temporarily unmasked for debugging

        const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        rows = result.rows;
    } catch (e) {
        error = e;
    }

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>Database Debug & Migration</h1>
            <div>
                <strong>POSTGRES_URL:</strong> {host}
            </div>
            <hr />

            <form action={async () => {
                "use server";
                try {
                    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
                    revalidatePath('/test-db');
                } catch (e) {
                    console.error("Migration Failed", e);
                    // We can't easily return error from action here without more complex UI code, 
                    // but checking logs or seeing if tables appear will work.
                }
            }}>
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        background: 'blue',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    RUN MIGRATIONS (Create Tables)
                </button>
            </form>
            <hr />

            {error ? (
                <div style={{ color: 'red' }}>
                    <h2>Error Connecting</h2>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>
            ) : (
                <div>
                    <h2>Tables Found ({rows.length})</h2>
                    <ul>
                        {rows.map((row: any) => (
                            <li key={row.table_name}>{row.table_name}</li>
                        ))}
                    </ul>
                    <pre style={{ background: '#f0f0f0', padding: 10 }}>
                        {JSON.stringify(rows, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
