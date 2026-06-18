import { createHmac, timingSafeEqual } from "node:crypto";

function getWebhookSecret(): string {
    return process.env.WEBHOOK_TENANT_SECRET ?? process.env.JWT_SECRET ?? "";
}

export function signWebhookTenant(userId: string): string {
    const secret = getWebhookSecret();
    if (!secret) {
        throw new Error("WEBHOOK_TENANT_SECRET or JWT_SECRET must be set for webhook tenant tokens");
    }

    const signature = createHmac("sha256", secret).update(userId).digest("base64url");
    return `${userId}.${signature}`;
}

export function verifyWebhookTenant(token: string): string | null {
    const secret = getWebhookSecret();
    if (!secret) return null;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return null;

    const userId = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!userId || !signature) return null;

    const expected = createHmac("sha256", secret).update(userId).digest("base64url");

    try {
        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expected);
        if (sigBuf.length !== expectedBuf.length) return null;
        if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
    } catch {
        return null;
    }

    return userId;
}
