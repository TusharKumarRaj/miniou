import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./user";

export type PendingEmailDraft = {
    to: string;
    subject: string;
    body: string;
};

export type PendingCalendarDraft = {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
    timeZone: string;
    attendeeEmails: string[];
};

export const chatSessionsTable = pgTable("chat_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),

    title: text("title").notNull().default("New chat"),

    pendingEmail: jsonb("pending_email").$type<PendingEmailDraft | null>(),

    pendingCalendar: jsonb("pending_calendar").$type<PendingCalendarDraft | null>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
