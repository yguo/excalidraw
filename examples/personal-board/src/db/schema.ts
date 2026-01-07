import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    libraryItems: text("libraryItems", { mode: "json" }),
});

export const accounts = sqliteTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        // composite primary key removed for simplicity in sqlite simple setup, or keep it
        // pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    })
);

export const sessions = sqliteTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const boards = sqliteTable("board", {
    id: text("id").primaryKey(),
    userId: text("userId")
        .notNull()
    // In a real app we might reference users.id if we use database persistence for auth
    // But if using JWT strategy only, we might just store the email or sub.
    // For now, let's assume we link to the user email or ID if available.
    ,
    title: text("title").notNull(),
    slug: text("slug").unique(),
    isPublic: integer("isPublic", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`),
});
