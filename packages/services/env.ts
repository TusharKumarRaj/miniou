import { z } from "zod";

const envSchema = z.object({
    JWT_SECRET: z.string().describe("Secret key for JWT tokens"),
    APP_URL: z.string().default("http://localhost:8000"),
    WEB_URL: z.string().default("http://localhost:3000"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GMAIL_PUBSUB_TOPIC: z.string().optional(),
    WEBHOOK_TENANT_SECRET: z.string().optional(),
    MEETING_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
    MEETING_RATE_LIMIT_WINDOW_MS: z.coerce
        .number()
        .int()
        .min(60_000)
        .default(60 * 60 * 1000),
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParseResult = envSchema.safeParse(env);
    if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
    return safeParseResult.data;
}

export const env = createEnv(process.env);
