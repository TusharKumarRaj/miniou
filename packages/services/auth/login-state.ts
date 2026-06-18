import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "../env";

const LOGIN_STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret() {
    return env.JWT_SECRET;
}

export function createGoogleLoginState() {
    const nonce = randomUUID();
    const expiresAt = Date.now() + LOGIN_STATE_TTL_MS;
    const payload = `${nonce}.${expiresAt}`;
    const signature = createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyGoogleLoginState(state: string) {
    const parts = state.split(".");
    if (parts.length !== 3) return false;

    const [nonce, expiresAtRaw, signature] = parts;
    if (!nonce || !expiresAtRaw || !signature) return false;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    const payload = `${nonce}.${expiresAtRaw}`;
    const expected = createHmac("sha256", getStateSecret()).update(payload).digest("base64url");

    try {
        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expected);
        if (sigBuf.length !== expectedBuf.length) return false;
        return timingSafeEqual(sigBuf, expectedBuf);
    } catch {
        return false;
    }
}
