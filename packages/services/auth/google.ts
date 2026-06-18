import { and, eq } from "@repo/database";
import { db } from "@repo/database";
import { authAccountsTable } from "@repo/database/models/auth-account";
import { usersTable } from "@repo/database/models/user";
import { OAuth2Client } from "google-auth-library";

import { env } from "../env";
import IntegrationService from "../integration";

const GOOGLE_PROVIDER = "google";

function getGoogleOAuthClient(redirectUri: string) {
    const clientId = env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
        throw new Error("Google sign-in is not configured");
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function getGoogleLoginRedirectUri() {
    return `${env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function createGoogleLoginUrl(state: string) {
    const client = getGoogleOAuthClient(getGoogleLoginRedirectUri());

    return client.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        prompt: "select_account",
        state,
    });
}

export type GoogleProfile = {
    sub: string;
    email: string;
    name: string;
    emailVerified: boolean;
};

export async function exchangeGoogleLoginCode(code: string): Promise<GoogleProfile> {
    const client = getGoogleOAuthClient(getGoogleLoginRedirectUri());
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
        throw new Error("Google did not return an ID token");
    }

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
        throw new Error("Google profile is missing required fields");
    }

    return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name?.trim() || payload.email.split("@")[0] || "miniou user",
        emailVerified: payload.email_verified === true,
    };
}

export async function findUserByGoogleAccount(googleSub: string) {
    const rows = await db
        .select({ userId: authAccountsTable.userId })
        .from(authAccountsTable)
        .where(
            and(
                eq(authAccountsTable.provider, GOOGLE_PROVIDER),
                eq(authAccountsTable.providerAccountId, googleSub),
            ),
        )
        .limit(1);

    return rows[0]?.userId ?? null;
}

async function linkGoogleAccount(userId: string, googleSub: string) {
    await db
        .insert(authAccountsTable)
        .values({
            userId,
            provider: GOOGLE_PROVIDER,
            providerAccountId: googleSub,
        })
        .onConflictDoNothing();
}

export class GoogleAuthService {
    private integrationService = new IntegrationService();

    public async signInOrSignUpWithGoogle(profile: GoogleProfile) {
        if (!profile.emailVerified) {
            throw new Error("Google account email is not verified");
        }

        let userId: string | null = await findUserByGoogleAccount(profile.sub);

        if (!userId) {
            const existingByEmail = await db
                .select({ id: usersTable.id })
                .from(usersTable)
                .where(eq(usersTable.email, profile.email))
                .limit(1);

            if (existingByEmail[0]) {
                userId = existingByEmail[0].id;
            } else {
                const created = await db
                    .insert(usersTable)
                    .values({
                        fullName: profile.name,
                        email: profile.email,
                    })
                    .returning({ id: usersTable.id });

                const newUserId = created[0]?.id;
                if (!newUserId) {
                    throw new Error("Failed to create user from Google sign-in");
                }
                userId = newUserId;
            }

            await linkGoogleAccount(userId, profile.sub);
        }

        await this.integrationService.ensureTenant(userId);
        return userId;
    }
}
