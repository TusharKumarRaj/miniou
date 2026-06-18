import type { Request, Response } from "express";

import UserService from "@repo/services/user";
import {
    createGoogleLoginUrl,
    exchangeGoogleLoginCode,
    GoogleAuthService,
} from "@repo/services/auth/google";
import { createGoogleLoginState, verifyGoogleLoginState } from "@repo/services/auth/login-state";
import { getAuthCookieOptions, getOAuthStateCookieOptions } from "@repo/trpc/server/utils/session-cookie";

import { env } from "../../env";

const userService = new UserService();
const googleAuthService = new GoogleAuthService();

const LOGIN_STATE_COOKIE = "google_login_state";

export function googleLoginHandler(_req: Request, res: Response) {
    try {
        const state = createGoogleLoginState();
        const url = createGoogleLoginUrl(state);

        res.cookie(LOGIN_STATE_COOKIE, state, getOAuthStateCookieOptions());
        res.redirect(url);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent(message)}`);
    }
}

export async function googleLoginCallbackHandler(req: Request, res: Response) {
    const error = req.query.error as string | undefined;
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const storedState = req.cookies?.[LOGIN_STATE_COOKIE];

    res.clearCookie(LOGIN_STATE_COOKIE, getOAuthStateCookieOptions());

    if (error) {
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent(error)}`);
        return;
    }

    if (!code || !state || !storedState || storedState !== state || !verifyGoogleLoginState(state)) {
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent("Invalid Google sign-in state")}`);
        return;
    }

    try {
        const profile = await exchangeGoogleLoginCode(code);
        const userId = await googleAuthService.signInOrSignUpWithGoogle(profile);
        const { token } = await userService.generateUserToken({ id: userId });

        res.cookie("token", token, getAuthCookieOptions());
        res.redirect(`${env.WEB_URL}/settings/integrations`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.redirect(`${env.WEB_URL}/login?error=${encodeURIComponent(message)}`);
    }
}
