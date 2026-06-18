import {
    matchesRecipient,
    mergeRecipients,
    parseAddressHeader,
    rankRecipient,
    type GmailRecipient,
} from "./recipients";

export type { GmailRecipient } from "./recipients";

export type TenantCorsair = ReturnType<typeof import("@repo/corsair").withUserTenant>;

export type GmailSendInput = {
    to: string;
    subject: string;
    body: string;
};

type MessagePartHeader = { name?: string; value?: string };
type MessagePart = {
    mimeType?: string;
    body?: { data?: string };
    parts?: MessagePart[];
    headers?: MessagePartHeader[];
};

type GmailMessage = {
    id?: string;
    threadId?: string;
    labelIds?: string[];
    snippet?: string;
    internalDate?: string;
    payload?: MessagePart;
};

export type GmailCorsairClient = {
    gmail: {
        api: {
            messages: {
                list: (input: {
                    maxResults?: number;
                    pageToken?: string;
                    labelIds?: string[];
                }) => Promise<{
                    messages?: Array<{ id?: string; threadId?: string }>;
                    nextPageToken?: string;
                }>;
                get: (input: {
                    id: string;
                    format?: "full" | "metadata" | "minimal" | "raw";
                    metadataHeaders?: string[];
                }) => Promise<GmailMessage>;
                send: (input: { raw: string; userId?: string }) => Promise<{
                    id?: string;
                    threadId?: string;
                }>;
            };
        };
    };
};

export function asGmailClient(tenant: TenantCorsair): GmailCorsairClient {
    return tenant as GmailCorsairClient;
}

function getHeader(headers: MessagePartHeader[] | undefined, name: string): string {
    const value = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;
    return value ?? "";
}

function decodeBodyData(data: string): string {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractPlainBody(payload: MessagePart | undefined): string {
    if (!payload) return "";

    if (payload.mimeType === "text/plain" && payload.body?.data) {
        return decodeBodyData(payload.body.data);
    }

    if (payload.parts) {
        for (const part of payload.parts) {
            const text = extractPlainBody(part);
            if (text) return text;
        }
    }

    return "";
}

function formatInternalDate(internalDate?: string | Date): string {
    if (!internalDate) return "";
    if (internalDate instanceof Date) {
        return internalDate.toISOString();
    }
    const ms = Number(internalDate);
    if (Number.isNaN(ms)) return internalDate;
    return new Date(ms).toISOString();
}

export function mapMessageSummary(message: GmailMessage) {
    const headers = message.payload?.headers;

    return {
        id: message.id ?? "",
        threadId: message.threadId ?? "",
        subject: getHeader(headers, "Subject") || "(no subject)",
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        snippet: message.snippet ?? "",
        date: formatInternalDate(message.internalDate),
        isUnread: message.labelIds?.includes("UNREAD") ?? false,
    };
}

export function mapMessageDetail(message: GmailMessage) {
    return {
        ...mapMessageSummary(message),
        body: extractPlainBody(message.payload) || message.snippet || "",
    };
}

export function buildGmailRawMessage({ to, subject, body }: GmailSendInput): string {
    const rfc2822 = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
    ].join("\r\n");

    return Buffer.from(rfc2822, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/u, "");
}

export async function sendGmailEmail(tenant: TenantCorsair, input: GmailSendInput) {
    const raw = buildGmailRawMessage(input);
    const corsair = asGmailClient(tenant);
    const result = await corsair.gmail.api.messages.send({ raw });

    return {
        messageId: result.id,
        threadId: result.threadId,
        to: input.to,
        subject: input.subject,
    };
}

export async function fetchLabelMessages(
    tenant: TenantCorsair,
    options: {
        labelIds?: string[];
        maxResults?: number;
        pageToken?: string;
    },
) {
    const corsair = asGmailClient(tenant);
    const list = await corsair.gmail.api.messages.list({
        maxResults: options.maxResults ?? 25,
        pageToken: options.pageToken,
        labelIds: options.labelIds ?? ["INBOX"],
    });

    const ids = (list.messages ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));

    const messages = await Promise.all(
        ids.map(async (id) => {
            // Omit metadataHeaders: Corsair joins them with commas, but Gmail expects repeated params.
            const message = await corsair.gmail.api.messages.get({
                id,
                format: "metadata",
            });
            return mapMessageSummary(message);
        }),
    );

    return {
        messages,
        nextPageToken: list.nextPageToken,
    };
}

/** @deprecated Use fetchLabelMessages */
export async function fetchInboxMessages(
    tenant: TenantCorsair,
    options: { maxResults?: number; pageToken?: string },
) {
    return fetchLabelMessages(tenant, { ...options, labelIds: ["INBOX"] });
}

export async function fetchGmailMessage(tenant: TenantCorsair, messageId: string) {
    const corsair = asGmailClient(tenant);
    const message = await corsair.gmail.api.messages.get({
        id: messageId,
        format: "full",
    });

    return mapMessageDetail(message);
}

async function collectRecipientsFromLabels(
    tenant: TenantCorsair,
    labelIds: string[],
    recipients: Map<string, GmailRecipient>,
    maxMessages: number,
) {
    const corsair = asGmailClient(tenant);
    const list = await corsair.gmail.api.messages.list({
        maxResults: maxMessages,
        labelIds,
    });

    const ids = (list.messages ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));

    await Promise.all(
        ids.map(async (id) => {
            const message = await corsair.gmail.api.messages.get({
                id,
                format: "metadata",
            });

            const headers = message.payload?.headers;
            for (const headerName of ["From", "To", "Cc"]) {
                const value = getHeader(headers, headerName);
                if (!value) continue;
                mergeRecipients(recipients, parseAddressHeader(value));
            }
        }),
    );
}

export async function searchGmailRecipients(
    tenant: TenantCorsair,
    query: string,
    options: { limit?: number } = {},
) {
    const limit = options.limit ?? 8;
    const recipients = new Map<string, GmailRecipient>();

    await Promise.all([
        collectRecipientsFromLabels(tenant, ["INBOX"], recipients, 25),
        collectRecipientsFromLabels(tenant, ["SENT"], recipients, 50),
    ]);

    const ranked = [...recipients.values()]
        .map((recipient) => ({
            recipient,
            score: rankRecipient(recipient, query),
        }))
        .filter(({ recipient, score }) => score > 0 || matchesRecipient(recipient, query))
        .sort((a, b) => b.score - a.score);

    return ranked.slice(0, limit).map(({ recipient }) => recipient);
}
