import { createHash } from "node:crypto";

import { corsair } from "@repo/corsair";
import { logger } from "@repo/logger";

import { env } from "../env";

import { signWebhookTenant } from "./tenant-token";

type CorsairPlugin = "gmail" | "googlecalendar";

type PluginKeys = {
    keys?: {
        get_access_token?: () => Promise<string | null>;
    };
};

async function getOAuthAccessToken(userId: string, plugin: CorsairPlugin): Promise<string> {
    const tenant = corsair.withTenant(userId) as Record<string, PluginKeys>;
    const keys = tenant[plugin]?.keys;
    if (!keys?.get_access_token) {
        throw new Error(`Corsair keys API unavailable for ${plugin}`);
    }

    const token = await keys.get_access_token();
    if (!token) {
        throw new Error(`${plugin} is not connected for this user`);
    }

    return token;
}

export function buildWebhookUrl(userId: string): string {
    const baseUrl = env.APP_URL.replace(/\/$/, "");
    const tenant = signWebhookTenant(userId);
    return `${baseUrl}/api/webhooks?tenant=${encodeURIComponent(tenant)}`;
}

function decodeGmailPushEmail(body: unknown): string | null {
    if (!body || typeof body !== "object") return null;
    const message = (body as { message?: { data?: string } }).message;
    if (!message?.data) return null;

    try {
        const json = Buffer.from(message.data, "base64").toString("utf-8");
        const parsed = JSON.parse(json) as { emailAddress?: string };
        return parsed.emailAddress ?? null;
    } catch {
        return null;
    }
}

export function extractGmailPushEmail(body: unknown): string | null {
    return decodeGmailPushEmail(body);
}

export async function registerGmailWatch(userId: string): Promise<void> {
    const topicName = env.GMAIL_PUBSUB_TOPIC?.trim();
    if (!topicName) {
        logger.debug("Skipping Gmail watch — GMAIL_PUBSUB_TOPIC is not set");
        return;
    }

    const accessToken = await getOAuthAccessToken(userId, "gmail");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            topicName,
            labelIds: ["INBOX"],
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gmail watch failed (${response.status}): ${text}`);
    }

    logger.info(`Registered Gmail inbox watch for tenant ${userId}`);
}

export async function registerCalendarWatch(userId: string): Promise<void> {
    const accessToken = await getOAuthAccessToken(userId, "googlecalendar");
    const webhookUrl = buildWebhookUrl(userId);
    const channelId = createHash("sha256").update(`miniou-calendar:${userId}`).digest("hex").slice(0, 64);
    const expiration = String(Date.now() + 6 * 24 * 60 * 60 * 1000);

    const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: channelId,
                type: "web_hook",
                address: webhookUrl,
                expiration,
            }),
        },
    );

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Calendar watch failed (${response.status}): ${text}`);
    }

    logger.info(`Registered Google Calendar watch for tenant ${userId}`);
}

export async function registerPluginWatch(userId: string, plugin: CorsairPlugin): Promise<void> {
    if (plugin === "gmail") {
        await registerGmailWatch(userId);
        return;
    }

    await registerCalendarWatch(userId);
}
