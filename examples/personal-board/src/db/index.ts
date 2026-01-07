import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// For local development, we use SQLite file.
// In production, we would use Cloudflare D1.

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });
