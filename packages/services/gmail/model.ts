import { z } from "zod";

import { dynamicArray, dynamicObject } from "../shared/dynamic-schema";

export const gmailMailboxLabelModel = z.enum([
    "INBOX",
    "STARRED",
    "DRAFT",
    "SENT",
    "SPAM",
    "TRASH",
]);

export type GmailMailboxLabel = z.infer<typeof gmailMailboxLabelModel>;

export const gmailMessageSummaryModel = dynamicObject({
    id: () => z.string(),
    threadId: () => z.string(),
    subject: () => z.string(),
    from: () => z.string(),
    to: () => z.string(),
    snippet: () => z.string(),
    date: () => z.string(),
    isUnread: () => z.boolean(),
});

export const listInboxInputModel = dynamicObject({
    label: () => gmailMailboxLabelModel.default("INBOX"),
    maxResults: () => z.coerce.number().int().min(1).max(50).default(25),
    pageToken: () => z.string().optional(),
    cursor: () => z.string().nullish(),
});

export type ListInboxInputModel = z.infer<typeof listInboxInputModel>;

export const listInboxOutputModel = dynamicObject({
    messages: () => dynamicArray(gmailMessageSummaryModel),
    nextPageToken: () => z.string().optional(),
});

export const getMessageInputModel = dynamicObject({
    messageId: () => z.string().min(1),
});

export type GetMessageInputModel = z.infer<typeof getMessageInputModel>;

export const getMessageOutputModel = dynamicObject({
    id: () => z.string(),
    threadId: () => z.string(),
    subject: () => z.string(),
    from: () => z.string(),
    to: () => z.string(),
    snippet: () => z.string(),
    date: () => z.string(),
    isUnread: () => z.boolean(),
    body: () => z.string(),
});

export const sendEmailInputModel = dynamicObject({
    to: () => z.string().min(1),
    subject: () => z.string(),
    body: () => z.string(),
});

export type SendEmailInputModel = z.infer<typeof sendEmailInputModel>;

export const sendEmailOutputModel = dynamicObject({
    messageId: () => z.string().optional(),
    threadId: () => z.string().optional(),
    to: () => z.string(),
    subject: () => z.string(),
});
