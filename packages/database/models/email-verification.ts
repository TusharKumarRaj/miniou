import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./user";

export const emailVerificationTokensTable = pgTable("email_verification_tokens", {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
