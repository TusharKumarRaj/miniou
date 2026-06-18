import { setupCorsair } from "corsair";
import { eq } from "@repo/database";
import { db } from "@repo/database";
import { corsairAccounts, corsairIntegrations } from "@repo/database/models/corsair";
import { corsair } from "@repo/corsair";

import { env } from "../env";

import { getSyncSignals } from "../sync-signal";

import {
    getConnectUrlInputModel,
    type GetConnectUrlInputModel,
} from "./model";

function isAccountConnected(config: Record<string, unknown>) {
    return (
        typeof config.access_token === "string" ||
        typeof config.refresh_token === "string"
    );
}

export default class IntegrationService {
    public async ensureTenant(userId: string) {
        await setupCorsair(corsair, { tenantId: userId });
    }

    public async getConnectionStatus(userId: string) {
        const accounts = await db
            .select({
                name: corsairIntegrations.name,
                config: corsairAccounts.config,
            })
            .from(corsairAccounts)
            .innerJoin(
                corsairIntegrations,
                eq(corsairAccounts.integrationId, corsairIntegrations.id),
            )
            .where(eq(corsairAccounts.tenantId, userId));

        const status = {
            gmail: false,
            googlecalendar: false,
        };

        for (const account of accounts) {
            const config = account.config as Record<string, unknown>;
            if (!isAccountConnected(config)) continue;

            if (account.name === "gmail") status.gmail = true;
            if (account.name === "googlecalendar") status.googlecalendar = true;
        }

        return status;
    }

    public async getConnectUrl(userId: string, payload: GetConnectUrlInputModel) {
        const { plugin } = await getConnectUrlInputModel.parseAsync(payload);

        await this.ensureTenant(userId);

        const url = new URL("/api/integrations/connect", env.APP_URL);
        url.searchParams.set("plugin", plugin);

        return { url: url.toString() };
    }

    public getSyncRevision(userId: string) {
        return getSyncSignals(userId);
    }
}
