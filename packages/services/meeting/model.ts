import { z } from "zod";

import { chatMessagePublicSchema, chatSessionPublicSchema } from "@repo/database/schemas/zod";

import { dynamicArray, dynamicObject } from "../shared/dynamic-schema";

export const sessionIdInput = () => z.string().uuid();

export const pendingEmailDraftModel = dynamicObject({
    to: () => z.string().min(1),
    subject: () => z.string(),
    body: () => z.string(),
});

export type PendingEmailDraftModel = z.infer<typeof pendingEmailDraftModel>;

export const pendingCalendarDraftModel = dynamicObject({
    title: () => z.string().min(1),
    description: () => z.string(),
    location: () => z.string(),
    start: () => z.string().min(1),
    end: () => z.string().min(1),
    timeZone: () => z.string(),
    attendeeEmails: () => z.array(z.string()),
});

export type PendingCalendarDraftModel = z.infer<typeof pendingCalendarDraftModel>;

export const chatAttachmentInputModel = dynamicObject({
    name: () => z.string().min(1).max(255).describe("Original file name"),
    mimeType: () => z.string().min(1).max(127).describe("MIME type of the file"),
    data: () =>
        z
            .string()
            .min(1)
            .max(6_000_000)
            .describe("Base64-encoded file contents"),
});

export type ChatAttachmentInputModel = z.infer<typeof chatAttachmentInputModel>;

export const chatAttachmentModel = chatAttachmentInputModel;

export const sendMessageInputModel = dynamicObject({
    sessionId: sessionIdInput,
    message: () =>
        z
            .string()
            .max(2000)
            .default("")
            .describe("Natural language message from the user"),
    attachments: () =>
        dynamicArray(chatAttachmentInputModel)
            .max(5)
            .optional()
            .describe("Optional files attached to the message"),
});

export type SendMessageInputModel = z.infer<typeof sendMessageInputModel>;

export const sendMessageOutputModel = dynamicObject({
    reply: () => z.string(),
    pendingEmail: () => pendingEmailDraftModel.nullable().optional(),
    pendingCalendar: () => pendingCalendarDraftModel.nullable().optional(),
});

export const prepareEmailDraftInputModel = sendMessageInputModel;
export type PrepareEmailDraftInputModel = SendMessageInputModel;

export const prepareEmailDraftOutputModel = sendMessageOutputModel;

export const prepareCalendarDraftInputModel = sendMessageInputModel;
export type PrepareCalendarDraftInputModel = SendMessageInputModel;

export const prepareCalendarDraftOutputModel = dynamicObject({
    reply: () => z.string(),
    pendingCalendar: () => pendingCalendarDraftModel.nullable().optional(),
});

export const confirmEmailSendInputModel = dynamicObject({
    sessionId: sessionIdInput,
    draft: () => pendingEmailDraftModel.optional(),
});

export type ConfirmEmailSendInputModel = z.infer<typeof confirmEmailSendInputModel>;

export const confirmEmailSendOutputModel = dynamicObject({
    reply: () => z.string(),
});

export const cancelEmailPreviewInputModel = dynamicObject({
    sessionId: sessionIdInput,
});

export type CancelEmailPreviewInputModel = z.infer<typeof cancelEmailPreviewInputModel>;

export const cancelEmailPreviewOutputModel = dynamicObject({
    ok: () => z.literal(true),
});

export const confirmCalendarEventInputModel = dynamicObject({
    sessionId: sessionIdInput,
    draft: () => pendingCalendarDraftModel.optional(),
});

export type ConfirmCalendarEventInputModel = z.infer<typeof confirmCalendarEventInputModel>;

export const confirmCalendarEventOutputModel = dynamicObject({
    reply: () => z.string(),
});

export const cancelCalendarPreviewInputModel = dynamicObject({
    sessionId: sessionIdInput,
});

export type CancelCalendarPreviewInputModel = z.infer<typeof cancelCalendarPreviewInputModel>;

export const cancelCalendarPreviewOutputModel = dynamicObject({
    ok: () => z.literal(true),
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
    pendingEmail: () => pendingEmailDraftModel.nullable().optional(),
    pendingCalendar: () => pendingCalendarDraftModel.nullable().optional(),
});

export const listSessionsOutputModel = dynamicObject({
    sessions: () => dynamicArray(chatSessionModel),
});

export const createSessionOutputModel = dynamicObject({
    session: () => chatSessionModel,
});
