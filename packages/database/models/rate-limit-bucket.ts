import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rateLimitBucketsTable = pgTable("rate_limit_buckets", {
    bucketKey: text("bucket_key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});
