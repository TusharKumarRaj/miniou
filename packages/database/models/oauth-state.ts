import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const oauthStatesTable = pgTable("oauth_states", {
    state: text("state").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
