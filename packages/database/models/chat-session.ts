import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./user";

export const chatSessionsTable = pgTable("chat_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),

    title: text("title").notNull().default("New chat"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
