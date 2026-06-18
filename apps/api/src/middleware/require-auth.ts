import type { NextFunction, Request, Response } from "express";

import { userService } from "@repo/trpc/server/services";

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const { id } = await userService.verifyAndDecodeUserToken(token);
        req.userId = id;
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
}
