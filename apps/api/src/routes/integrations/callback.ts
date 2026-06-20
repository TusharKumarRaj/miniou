import { processOAuthCallback } from "corsair/oauth";

import type { Request, Response } from "express";

import { corsair } from "@repo/corsair";
import { consumeOAuthState } from "@repo/services/oauth-state";
import WebhookService from "@repo/services/webhooks";
import { getOAuthStateCookieOptions } from "@repo/trpc/server/utils/session-cookie";

import { env } from "../../env";

const REDIRECT_URI = `${env.BASE_URL}/api/integrations/callback`;
const INTEGRATIONS_URL = `${env.WEB_URL}/settings/integrations`;
const webhookService = new WebhookService();

function redirectToIntegrations(res: Response, params?: Record<string, string>) {
    const url = new URL(INTEGRATIONS_URL);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
    }
    res.redirect(302, url.toString());
}



export async function callbackHandler(req: Request, res: Response) {

    const code = req.query.code as string | undefined;

    const state = req.query.state as string | undefined;

    const error = req.query.error as string | undefined;



    const oauthCookieOptions = getOAuthStateCookieOptions();

    const clearOAuthCookie = () => res.clearCookie("oauth_state", oauthCookieOptions);



    if (error) {
        clearOAuthCookie();
        redirectToIntegrations(res, { error });
        return;
    }

    if (!code || !state) {
        clearOAuthCookie();
        redirectToIntegrations(res, { error: "missing_code_or_state" });
        return;
    }



    const storedState = req.cookies?.oauth_state;



    if (!storedState || storedState !== state) {
        clearOAuthCookie();
        redirectToIntegrations(res, { error: "invalid_state" });
        return;
    }

    const stateValid = await consumeOAuthState(state);
    if (!stateValid) {
        clearOAuthCookie();
        redirectToIntegrations(res, { error: "expired_state" });
        return;
    }



    clearOAuthCookie();



    try {

        const result = await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        if (result.plugin === "gmail" || result.plugin === "googlecalendar") {
            await webhookService.registerAfterConnect(result.tenantId, result.plugin);
        }

        redirectToIntegrations(res, { connected: result.plugin });
    } catch (err) {
        console.error("OAuth callback failed:", err);
        redirectToIntegrations(res, { error: "oauth_failed" });
    }
}


