import { eq } from "@repo/database";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { logger } from "@repo/logger";

import { registerPluginWatch, extractGmailPushEmail } from "./register";
import { verifyWebhookTenant } from "./tenant-token";

export { buildWebhookUrl, extractGmailPushEmail, registerPluginWatch } from "./register";
export { signWebhookTenant, verifyWebhookTenant } from "./tenant-token";

export default class WebhookService {
    public resolveTenantId(query: Record<string, unknown>): string | null {
        const tenantParam = query.tenant;
        if (typeof tenantParam === "string" && tenantParam.length > 0) {
            const userId = verifyWebhookTenant(tenantParam);
            if (userId) return userId;
        }

        return null;
    }

    public async resolveTenantIdFromGmailPush(body: unknown): Promise<string | null> {
        const email = extractGmailPushEmail(body);
        if (!email) return null;

        const rows = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        return rows[0]?.id ?? null;
    }

    public async registerAfterConnect(userId: string, plugin: "gmail" | "googlecalendar"): Promise<void> {
        try {
            await registerPluginWatch(userId, plugin);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`Webhook watch registration failed for ${plugin} (${userId}): ${message}`);
        }
    }
}
