import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import rateLimit from "express-rate-limit";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";
import cookieParser from "cookie-parser";

import { requireAuth } from "./middleware/require-auth";
import { connectHandler } from "./routes/integrations/connect";
import { callbackHandler } from "./routes/integrations/callback";
import { googleLoginCallbackHandler, googleLoginHandler } from "./routes/auth/google";
import { webhookHandler } from "./routes/webhooks/handler";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "miniou OpenAPI",
    version: "1.0.0",
    baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
    cors({
        origin: env.WEB_URL,
        credentials: true,
    }),
);

app.use(cookieParser());

app.post("/api/webhooks", express.json(), webhookHandler);

app.use(express.json());

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === "prod" ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});

app.use("/trpc", apiRateLimiter);
app.use("/api", (req, res, next) => {
    if (req.path === "/webhooks") {
        next();
        return;
    }
    apiRateLimiter(req, res, next);
});

app.get("/", (req, res) => {
    return res.json({ message: "miniou is up and running..." });
});

app.get("/health", (req, res) => {
    return res.json({ message: "miniou server is healthy", healthy: true });
});

app.get("/api/integrations/connect", requireAuth, connectHandler);
app.get("/api/integrations/callback", callbackHandler);

app.get("/api/auth/google", googleLoginHandler);
app.get("/api/auth/google/callback", googleLoginCallbackHandler);

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
    return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
    "/api",
    createOpenApiExpressMiddleware({
        router: serverRouter,
        createContext,
    }),
);

app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
        router: serverRouter,
        createContext,
    }),
);

export default app;
