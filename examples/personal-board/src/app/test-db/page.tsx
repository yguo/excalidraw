import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    let error: any = null;
    let rows: any[] = [];
    let host = "unknown";

    try {
        const url = process.env.POSTGRES_URL || "";
        // Mask the password
        host = url.replace(/:[^:@]*@/, ":***@");

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
            <h1>Database Debug</h1>
            <div>
                <strong>POSTGRES_URL Host:</strong> {host}
            </div>
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
