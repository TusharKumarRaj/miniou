import { generateOAuthUrl } from "corsair/oauth";

import type { Response } from "express";



import { corsair } from "@repo/corsair";

import { registerOAuthState } from "@repo/services/oauth-state";

import { getOAuthStateCookieOptions } from "@repo/trpc/server/utils/session-cookie";



import { env } from "../../env";

import type { AuthenticatedRequest } from "../../middleware/require-auth";



const REDIRECT_URI = `${env.BASE_URL}/api/integrations/callback`;



export async function connectHandler(req: AuthenticatedRequest, res: Response) {

    const userId = req.userId;

    if (!userId) {

        res.status(401).json({ error: "Unauthorized" });

        return;

    }



    const plugin = req.query.plugin as string | undefined;

    if (!plugin) {

        res.status(400).json({ error: "Missing plugin param" });

        return;

    }



    if (plugin !== "gmail" && plugin !== "googlecalendar") {

        res.status(400).json({ error: "Invalid plugin" });

        return;

    }



    try {

        const { url, state } = await generateOAuthUrl(corsair, plugin, {

            tenantId: userId,

            redirectUri: REDIRECT_URI,

        });



        await registerOAuthState(state);

        res.cookie("oauth_state", state, getOAuthStateCookieOptions());

        res.redirect(url);

    } catch (err) {

        const message = err instanceof Error ? err.message : String(err);

        res.status(500).json({ error: message });

    }

}


