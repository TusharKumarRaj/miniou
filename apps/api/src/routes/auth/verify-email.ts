import type { Request, Response } from "express";

import { verifyEmailToken } from "@repo/services/auth/google";
import UserService from "@repo/services/user";
import { getAuthCookieOptions } from "@repo/trpc/server/utils/session-cookie";

import { env } from "../../env";

const userService = new UserService();

export async function verifyEmailHandler(req: Request, res: Response) {
    const token = req.query.token;

    if (typeof token !== "string" || token.length === 0) {
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent("Missing verification token")}`);
        return;
    }

    try {
        const userId = await verifyEmailToken(token);
        const { token: sessionToken } = await userService.generateUserToken({ id: userId });

        res.cookie("token", sessionToken, getAuthCookieOptions());
        res.redirect(`${env.WEB_URL}/settings/integrations?verified=1`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent(message)}`);
    }
}
