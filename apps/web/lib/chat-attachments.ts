export const CHAT_ATTACHMENT_MAX_COUNT = 5;
export const CHAT_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
]);

export type PendingChatAttachment = {
    id: string;
    name: string;
    mimeType: string;
    data: string;
    size: number;
    previewUrl?: string;
};

export type ChatAttachmentPayload = {
    name: string;
    mimeType: string;
    data: string;
};

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Could not read file."));
                return;
            }

            const commaIndex = result.indexOf(",");
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
        };
        reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
        reader.readAsDataURL(file);
    });
}

export function validateAttachmentFile(file: File) {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
        throw new Error(`Unsupported file type: ${file.name}. Use images, PDF, or text files.`);
    }

    if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
        throw new Error(`"${file.name}" is too large. Max size is 4 MB per file.`);
    }
}

export async function fileToPendingAttachment(file: File): Promise<PendingChatAttachment> {
    validateAttachmentFile(file);

    const data = await readFileAsBase64(file);
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

    return {
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type,
        data,
        size: file.size,
        previewUrl,
    };
}

export function pendingAttachmentToPayload(
    attachment: PendingChatAttachment,
): ChatAttachmentPayload {
    return {
        name: attachment.name,
        mimeType: attachment.mimeType,
        data: attachment.data,
    };
}

export function revokeAttachmentPreviews(attachments: PendingChatAttachment[]) {
    for (const attachment of attachments) {
        if (attachment.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl);
        }
    }
}

export function formatAttachmentSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(mimeType: string | undefined) {
    return Boolean(mimeType?.startsWith("image/"));
}
