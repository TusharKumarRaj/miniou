import { z } from "zod";

import { chatMessagePublicSchema, chatSessionPublicSchema } from "@repo/database/schemas/zod";

import { dynamicArray, dynamicObject } from "../shared/dynamic-schema";

export const sessionIdInput = () => z.string().uuid();

export const sendMessageInputModel = dynamicObject({
    sessionId: sessionIdInput,
    message: () =>
        z
            .string()
            .min(1)
            .max(2000)
            .describe("Natural language message from the user"),
});

export type SendMessageInputModel = z.infer<typeof sendMessageInputModel>;

export const sendMessageOutputModel = dynamicObject({
    reply: () => z.string(),
});

export const getHistoryInputModel = dynamicObject({
    sessionId: sessionIdInput,
    limit: () => z.coerce.number().int().min(1).max(100).default(50),
});

export type GetHistoryInputModel = z.infer<typeof getHistoryInputModel>;

export const createSessionInputModel = dynamicObject({
    title: () => z.string().min(1).max(120).optional(),
});

export type CreateSessionInputModel = z.infer<typeof createSessionInputModel>;

export const listSessionsInputModel = dynamicObject({
    limit: () => z.coerce.number().int().min(1).max(50).default(30),
});

export type ListSessionsInputModel = z.infer<typeof listSessionsInputModel>;

export const chatMessageModel = chatMessagePublicSchema;

export const chatSessionModel = chatSessionPublicSchema;

export const getHistoryOutputModel = dynamicObject({
    messages: () => dynamicArray(chatMessageModel),
});

export const listSessionsOutputModel = dynamicObject({
    sessions: () => dynamicArray(chatSessionModel),
});

export const createSessionOutputModel = dynamicObject({
    session: () => chatSessionModel,
});
