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
    threadId?: string;
    inReplyTo?: string;
    references?: string;
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

type GmailThread = {
    id?: string;
    snippet?: string;
    messages?: GmailMessage[];
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
                send: (input: { raw: string; userId?: string; threadId?: string }) => Promise<{
                    id?: string;
                    threadId?: string;
                }>;
            };
            threads: {
                list: (input: {
                    maxResults?: number;
                    pageToken?: string;
                    labelIds?: string[];
                }) => Promise<{
                    threads?: Array<{ id?: string }>;
                    nextPageToken?: string;
                }>;
                get: (input: {
                    id: string;
                    format?: "full" | "metadata" | "minimal";
                    metadataHeaders?: string[];
                }) => Promise<GmailThread>;
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

type BodyContent = {
    plain: string;
    html: string;
};

function extractBodies(payload: MessagePart | undefined): BodyContent {
    if (!payload) return { plain: "", html: "" };

    const result = { plain: "", html: "" };

    if (payload.mimeType === "text/plain" && payload.body?.data) {
        result.plain = decodeBodyData(payload.body.data);
    } else if (payload.mimeType === "text/html" && payload.body?.data) {
        result.html = decodeBodyData(payload.body.data);
    }

    if (payload.parts) {
        for (const part of payload.parts) {
            const nested = extractBodies(part);
            if (!result.plain && nested.plain) result.plain = nested.plain;
            if (!result.html && nested.html) result.html = nested.html;
        }
    }

    return result;
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

function messageTimestamp(message: GmailMessage): number {
    const ms = Number(message.internalDate ?? 0);
    return Number.isNaN(ms) ? 0 : ms;
}

function pickLatestMessage(messages: GmailMessage[]): GmailMessage | undefined {
    if (!messages.length) return undefined;
    return messages.reduce((latest, message) =>
        messageTimestamp(message) > messageTimestamp(latest) ? message : latest,
    );
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
    const { plain, html } = extractBodies(message.payload);
    const headers = message.payload?.headers;

    return {
        ...mapMessageSummary(message),
        body: plain || message.snippet || "",
        bodyText: plain || message.snippet || "",
        bodyHtml: html,
        internetMessageId: getHeader(headers, "Message-ID"),
    };
}

export function mapThreadSummary(thread: GmailThread) {
    const messages = thread.messages ?? [];
    const latest = pickLatestMessage(messages);
    if (!latest) return null;

    const summary = mapMessageSummary(latest);

    return {
        ...summary,
        id: thread.id ?? summary.threadId,
        threadId: thread.id ?? summary.threadId,
        messageCount: messages.length,
        isUnread: messages.some((message) => message.labelIds?.includes("UNREAD")),
    };
}

export function buildGmailRawMessage(input: GmailSendInput): string {
    const lines = [`To: ${input.to}`, `Subject: ${input.subject}`];

    if (input.inReplyTo) {
        lines.push(`In-Reply-To: ${input.inReplyTo}`);
    }
    if (input.references) {
        lines.push(`References: ${input.references}`);
    }

    lines.push(
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        input.body,
    );

    return Buffer.from(lines.join("\r\n"), "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/u, "");
}

export async function sendGmailEmail(tenant: TenantCorsair, input: GmailSendInput) {
    const raw = buildGmailRawMessage(input);
    const corsair = asGmailClient(tenant);
    const result = await corsair.gmail.api.messages.send({
        raw,
        threadId: input.threadId,
    });

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
    const list = await corsair.gmail.api.threads.list({
        maxResults: options.maxResults ?? 25,
        pageToken: options.pageToken,
        labelIds: options.labelIds ?? ["INBOX"],
    });

    const ids = (list.threads ?? []).map((thread) => thread.id).filter((id): id is string => Boolean(id));

    const threads = await Promise.all(
        ids.map(async (id) => {
            const thread = await corsair.gmail.api.threads.get({
                id,
                format: "metadata",
            });
            return mapThreadSummary(thread);
        }),
    );

    return {
        messages: threads.filter((thread): thread is NonNullable<typeof thread> => Boolean(thread)),
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

export async function fetchGmailThread(tenant: TenantCorsair, threadId: string) {
    const corsair = asGmailClient(tenant);
    const thread = await corsair.gmail.api.threads.get({
        id: threadId,
        format: "full",
    });

    const messages = (thread.messages ?? [])
        .slice()
        .sort((a, b) => messageTimestamp(a) - messageTimestamp(b))
        .map(mapMessageDetail);

    const latest = messages.at(-1);

    return {
        threadId: thread.id ?? threadId,
        subject: latest?.subject ?? "(no subject)",
        messages,
    };
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
