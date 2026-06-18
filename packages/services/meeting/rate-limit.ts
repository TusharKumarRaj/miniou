import { eq } from "@repo/database";
import { db } from "@repo/database";
import { rateLimitBucketsTable } from "@repo/database/models/rate-limit-bucket";

import { env } from "../env";

function formatRateLimitWindow(windowMs: number): string {
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    if (windowMs >= dayMs && windowMs % dayMs === 0) {
        const days = windowMs / dayMs;
        return days === 1 ? "per day" : `per ${days} days`;
    }

    if (windowMs >= hourMs && windowMs % hourMs === 0) {
        const hours = windowMs / hourMs;
        return hours === 1 ? "per hour" : `per ${hours} hours`;
    }

    const minutes = Math.max(1, Math.round(windowMs / (60 * 1000)));
    return minutes === 1 ? "per minute" : `per ${minutes} minutes`;
}

export class MeetingRateLimitError extends Error {
    constructor() {
        const windowLabel = formatRateLimitWindow(env.MEETING_RATE_LIMIT_WINDOW_MS);
        super(
            `Rate limit exceeded. You can send up to ${env.MEETING_RATE_LIMIT_MAX} messages ${windowLabel}. Try again later.`,
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
