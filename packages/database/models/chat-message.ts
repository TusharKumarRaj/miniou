import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { chatSessionsTable } from "./chat-session";
import { usersTable } from "./user";

export const chatMessageRoleEnum = pgEnum("chat_message_role", ["user", "assistant"]);

export const chatMessagesTable = pgTable("chat_messages", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),

    sessionId: uuid("session_id")
        .notNull()
        .references(() => chatSessionsTable.id, { onDelete: "cascade" }),

    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});
