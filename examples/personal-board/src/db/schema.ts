import { pgTable, text, timestamp, boolean, json, integer, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    name: text('name'),
    email: text('email').notNull().primaryKey(),
    image: text('image'),
    libraryItems: json('libraryItems').$type<any[]>(),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
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
        pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    expires: timestamp("expires").notNull(),
});

export const boards = pgTable("board", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    title: text("title").notNull(),
    slug: text("slug").unique(),
    isPublic: boolean("isPublic").default(false),
    elements: json("elements").$type<any[]>(),
    appState: json("appState").$type<any>(),
    files: json("files").$type<any>(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});
