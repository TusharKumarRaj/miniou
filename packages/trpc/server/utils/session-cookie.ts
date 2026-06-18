import type { CookieOptions } from "express";

type AppEnv = "development" | "prod";

function resolveAppEnv(): AppEnv {
    const nodeEnv = String(process.env.NODE_ENV ?? "development");
    return nodeEnv === "production" || nodeEnv === "prod" ? "prod" : "development";
}

export function getAuthCookieOptions(): CookieOptions {
    const isProd = resolveAppEnv() === "prod";

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };
}

export function getOAuthStateCookieOptions(): CookieOptions {
    const isProd = resolveAppEnv() === "prod";

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
    };
}

export function getClearAuthCookieOptions(): CookieOptions {
    const isProd = resolveAppEnv() === "prod";

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
    };
}
