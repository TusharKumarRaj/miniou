import type { FilePart, ImagePart, ModelMessage, TextPart } from "ai";

import type { ChatMessageAttachment } from "@repo/database/models/chat-message";

import type { ChatAttachmentInputModel } from "./model";

export const CHAT_ATTACHMENT_MAX_COUNT = 5;
export const CHAT_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

type ContentPart = TextPart | ImagePart | FilePart;

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
]);

export class ChatAttachmentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ChatAttachmentError";
    }
}

function decodeBase64(data: string): Buffer {
    try {
        return Buffer.from(data, "base64");
    } catch {
        throw new ChatAttachmentError("Invalid attachment encoding.");
    }
}

export function validateChatAttachments(attachments: ChatAttachmentInputModel[] | undefined) {
    if (!attachments?.length) return;

    if (attachments.length > CHAT_ATTACHMENT_MAX_COUNT) {
        throw new ChatAttachmentError(`You can attach up to ${CHAT_ATTACHMENT_MAX_COUNT} files.`);
    }

    for (const attachment of attachments) {
        if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(attachment.mimeType)) {
            throw new ChatAttachmentError(
                `Unsupported file type: ${attachment.name}. Use images, PDF, or text files.`,
            );
        }

        const bytes = decodeBase64(attachment.data);
        if (bytes.length === 0) {
            throw new ChatAttachmentError(`File "${attachment.name}" is empty.`);
        }

        if (bytes.length > CHAT_ATTACHMENT_MAX_BYTES) {
            throw new ChatAttachmentError(
                `File "${attachment.name}" is too large. Max size is 4 MB per file.`,
            );
        }
    }
}

export function normalizeChatAttachments(
    attachments: ChatAttachmentInputModel[] | undefined,
): ChatMessageAttachment[] | null {
    if (!attachments?.length) return null;

    validateChatAttachments(attachments);

    return attachments.map((attachment) => ({
        name: attachment.name,
        mimeType: attachment.mimeType,
        data: attachment.data,
    }));
}

function appendTextPart(parts: ContentPart[], text: string) {
    const last = parts.at(-1);
    if (last?.type === "text") {
        last.text = `${last.text}\n\n${text}`;
        return;
    }

    parts.push({ type: "text", text });
}

function buildAttachmentParts(attachment: ChatMessageAttachment): ContentPart[] {
    const bytes = decodeBase64(attachment.data);

    if (attachment.mimeType.startsWith("image/")) {
        return [
            {
                type: "image",
                image: bytes,
                mediaType: attachment.mimeType,
            },
        ];
    }

    if (attachment.mimeType === "application/pdf") {
        return [
            {
                type: "file",
                data: bytes,
                mediaType: attachment.mimeType,
                filename: attachment.name,
            },
        ];
    }

    const text = bytes.toString("utf-8").slice(0, 50_000);
    return [{ type: "text", text: `--- ${attachment.name} ---\n${text}` }];
}

export function buildUserModelMessage(
    content: string,
    attachments: ChatMessageAttachment[] | null | undefined,
): ModelMessage {
    const trimmed = content.trim();
    const parts: ContentPart[] = [];

    if (trimmed) {
        parts.push({ type: "text", text: trimmed });
    } else if (attachments?.length) {
        parts.push({ type: "text", text: "Please review the attached file(s)." });
    }

    for (const attachment of attachments ?? []) {
        const attachmentParts = buildAttachmentParts(attachment);
        for (const part of attachmentParts) {
            if (part.type === "text") {
                appendTextPart(parts, part.text);
            } else {
                parts.push(part);
            }
        }
    }

    return {
        role: "user",
        content: parts.length === 1 && parts[0]?.type === "text" ? parts[0].text : parts,
    };
}

export function buildModelMessages(
    rows: Array<{
        role: "user" | "assistant";
        content: string;
        attachments?: ChatMessageAttachment[] | null;
    }>,
): ModelMessage[] {
    return rows.map((row) => {
        if (row.role === "assistant") {
            return { role: "assistant", content: row.content };
        }

        return buildUserModelMessage(row.content, row.attachments);
    });
}

export function attachmentSummary(attachments: ChatMessageAttachment[] | null | undefined) {
    if (!attachments?.length) return "";
    const names = attachments.map((attachment) => attachment.name).join(", ");
    return `[Attached: ${names}]`;
}
