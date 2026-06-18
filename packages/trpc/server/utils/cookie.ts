import type { CookieOptions, Request, Response } from "express";

export function setCookie(res: Response, name: string, value: string, opts: CookieOptions) {
    res.cookie(name, value, opts);
}

export function getCookie(req: Request, name: string): string | undefined {
    return req.cookies?.[name];
}

export function clearCookie(res: Response, name: string, opts?: CookieOptions) {
    res.clearCookie(name, opts);
}
