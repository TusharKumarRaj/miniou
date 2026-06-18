import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./user";

export const authAccountsTable = pgTable(
    "auth_accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        provider: text("provider").notNull(),
        providerAccountId: text("provider_account_id").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [unique().on(table.provider, table.providerAccountId)],
);
