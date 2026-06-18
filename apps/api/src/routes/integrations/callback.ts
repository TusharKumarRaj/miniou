import { processOAuthCallback } from "corsair/oauth";

import type { Request, Response } from "express";

import { corsair } from "@repo/corsair";
import { consumeOAuthState } from "@repo/services/oauth-state";
import WebhookService from "@repo/services/webhooks";
import { getOAuthStateCookieOptions } from "@repo/trpc/server/utils/session-cookie";

import { env } from "../../env";

const REDIRECT_URI = `${env.BASE_URL}/api/integrations/callback`;
const webhookService = new WebhookService();



function escapeHtml(value: string): string {

    return value

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#39;");

}



export async function callbackHandler(req: Request, res: Response) {

    const code = req.query.code as string | undefined;

    const state = req.query.state as string | undefined;

    const error = req.query.error as string | undefined;



    const oauthCookieOptions = getOAuthStateCookieOptions();

    const clearOAuthCookie = () => res.clearCookie("oauth_state", oauthCookieOptions);



    if (error) {

        clearOAuthCookie();

        res.status(400).send(

            `<html><body><h2>Authorization failed</h2><p>${escapeHtml(error)}</p><p><a href="${env.WEB_URL}/settings/integrations">Back to integrations</a></p></body></html>`,

        );

        return;

    }



    if (!code || !state) {

        clearOAuthCookie();

        res.status(400).send("<p>Missing code or state parameter.</p>");

        return;

    }



    const storedState = req.cookies?.oauth_state;



    if (!storedState || storedState !== state) {

        clearOAuthCookie();

        res.status(400).send("<p>Invalid state. Possible CSRF attempt.</p>");

        return;

    }



    const stateValid = await consumeOAuthState(state);

    if (!stateValid) {

        clearOAuthCookie();

        res.status(400).send("<p>Invalid or expired OAuth state.</p>");

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

        res.send(

            `<html><body><h2>Connected!</h2>` +

                `<p>Plugin <strong>${escapeHtml(result.plugin)}</strong> authorized.</p>` +

                `<p><a href="${env.WEB_URL}/settings/integrations">Back to integrations</a></p></body></html>`,

        );

    } catch (err) {

        const message = err instanceof Error ? err.message : String(err);

        res.status(500).send(

            `<html><body><h2>OAuth error</h2><p>${escapeHtml(message)}</p><p><a href="${env.WEB_URL}/settings/integrations">Back to integrations</a></p></body></html>`,

        );

    }

}


