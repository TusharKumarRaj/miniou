import { eq, lt } from "@repo/database";
import { db } from "@repo/database";
import { oauthStatesTable } from "@repo/database/models/oauth-state";

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export async function registerOAuthState(state: string, ttlMs = DEFAULT_TTL_MS) {
    const expiresAt = new Date(Date.now() + ttlMs);

    await db.delete(oauthStatesTable).where(lt(oauthStatesTable.expiresAt, new Date()));
    await db.insert(oauthStatesTable).values({ state, expiresAt });
}

export async function consumeOAuthState(state: string): Promise<boolean> {
    const rows = await db
        .select({ expiresAt: oauthStatesTable.expiresAt })
        .from(oauthStatesTable)
        .where(eq(oauthStatesTable.state, state))
        .limit(1);

    if (rows.length === 0) {
        return false;
    }

    const { expiresAt } = rows[0]!;

    await db.delete(oauthStatesTable).where(eq(oauthStatesTable.state, state));

    return expiresAt.getTime() > Date.now();
}
