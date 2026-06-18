import { eq } from "@repo/database";
import { db } from "@repo/database";
import { rateLimitBucketsTable } from "@repo/database/models/rate-limit-bucket";

import { env } from "../env";

export class MeetingRateLimitError extends Error {
    constructor() {
        super(
            `Rate limit exceeded. Try again in a few minutes (max ${env.MEETING_RATE_LIMIT_MAX} messages per hour).`,
        );
        this.name = "MeetingRateLimitError";
    }
}

export async function assertMeetingRateLimit(userId: string) {
    const bucketKey = `meeting:sendMessage:${userId}`;
    const now = Date.now();
    const windowMs = env.MEETING_RATE_LIMIT_WINDOW_MS;
    const max = env.MEETING_RATE_LIMIT_MAX;

    const existing = await db
        .select()
        .from(rateLimitBucketsTable)
        .where(eq(rateLimitBucketsTable.bucketKey, bucketKey))
        .limit(1);

    if (existing.length === 0) {
        await db.insert(rateLimitBucketsTable).values({
            bucketKey,
            count: 1,
            windowStart: new Date(now),
        });
        return;
    }

    const bucket = existing[0]!;
    const windowStartMs = bucket.windowStart.getTime();

    if (now - windowStartMs >= windowMs) {
        await db
            .update(rateLimitBucketsTable)
            .set({ count: 1, windowStart: new Date(now) })
            .where(eq(rateLimitBucketsTable.bucketKey, bucketKey));
        return;
    }

    if (bucket.count >= max) {
        throw new MeetingRateLimitError();
    }

    await db
        .update(rateLimitBucketsTable)
        .set({ count: bucket.count + 1 })
        .where(eq(rateLimitBucketsTable.bucketKey, bucketKey));
}
