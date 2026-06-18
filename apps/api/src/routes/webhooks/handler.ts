import { processWebhook } from "corsair";

import type { Request, Response } from "express";

import { corsair } from "@repo/corsair";
import { logger } from "@repo/logger";
import { bumpSyncSignal } from "@repo/services/sync-signal";
import WebhookService, { extractGmailPushEmail } from "@repo/services/webhooks";

const webhookService = new WebhookService();

function normalizeHeaders(req: Request): Record<string, string | string[] | undefined> {
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
            headers[key] = value;
        }
    }
    return headers;
}

function sendWebhookResponse(res: Response, result: Awaited<ReturnType<typeof processWebhook>>) {
    if (result.responseHeaders) {
        for (const [name, value] of Object.entries(result.responseHeaders)) {
            res.setHeader(name, value);
        }
    }

    if (result.response) {
        const { statusCode, success, error, data, corsairEntityId, ...rest } = result.response;
        const status = statusCode ?? (success ? 200 : 500);
        res.status(status);

        if (data !== undefined) {
            res.json(data);
            return;
        }

        const extra = Object.fromEntries(
            Object.entries(rest).filter(([key]) => key !== "returnToSender"),
        );
        if (Object.keys(extra).length > 0) {
            res.json(extra);
            return;
        }

        res.send(success ? "OK" : error ?? "Webhook failed");
        return;
    }

    res.status(200).send("OK");
}

export async function webhookHandler(req: Request, res: Response) {
    try {
        let tenantId =
            webhookService.resolveTenantId(req.query as Record<string, unknown>) ??
            (await webhookService.resolveTenantIdFromGmailPush(req.body));

        if (!tenantId) {
            res.status(400).json({ error: "Unknown tenant" });
            return;
        }

        const result = await processWebhook(corsair, normalizeHeaders(req), req.body, {
            tenantId,
        });

        if (result.plugin) {
            logger.debug(`Webhook handled by ${result.plugin}.${result.action ?? "unknown"}`);
        }

        if (result.plugin === "gmail" || result.plugin === "googlecalendar") {
            bumpSyncSignal(tenantId, result.plugin);
        } else if (extractGmailPushEmail(req.body)) {
            bumpSyncSignal(tenantId, "gmail");
        }

        sendWebhookResponse(res, result);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Webhook processing failed: ${message}`);
        res.status(500).json({ error: "Webhook processing failed" });
    }
}
