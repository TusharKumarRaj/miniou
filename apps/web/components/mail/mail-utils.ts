export function extractEmailAddress(value: string): string {
    const match = value.match(/<([^>]+)>/);
    return (match?.[1] ?? value).trim();
}

export function replySubject(subject: string): string {
    const trimmed = subject.trim();
    return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function forwardSubject(subject: string): string {
    const trimmed = subject.trim();
    return /^fwd:/i.test(trimmed) ? trimmed : `Fwd: ${trimmed}`;
}

export function formatQuotedReply(message: {
    from: string;
    date: string;
    bodyText?: string;
    body?: string;
}) {
    const body = (message.bodyText ?? message.body ?? "").trim();
    const quoted = body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    const header = `On ${message.date}, ${message.from} wrote:`;
    return `\n\n${header}\n${quoted}`;
}

export function formatForwardedMessage(message: {
    from: string;
    to: string;
    date: string;
    subject: string;
    bodyText?: string;
    body?: string;
}) {
    const body = (message.bodyText ?? message.body ?? "").trim();
    return [
        "",
        "---------- Forwarded message ---------",
        `From: ${message.from}`,
        `Date: ${message.date}`,
        `Subject: ${message.subject}`,
        `To: ${message.to}`,
        "",
        body,
    ].join("\n");
}

export function isConversationalReply(bodyText: string, bodyHtml?: string): boolean {
    const plain = bodyText.trim();
    const html = bodyHtml?.trim() ?? "";

    if (parseReplyPlainText(plain).quoteHeader) return true;
    if (/gmail_quote/i.test(html)) return true;
    if (/wrote:/i.test(html) && /<blockquote/i.test(html)) return true;

    return false;
}

export function htmlToPlainText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function parseReplyPlainText(text: string): {
    replyText: string;
    quoteHeader?: string;
    quotedText?: string;
} {
    const normalized = text.replace(/\r\n/g, "\n");
    const match = normalized.match(/(?:^|\n{1,2})(On .+ wrote:)\s*\n([\s\S]*)$/);

    if (!match || match.index === undefined) {
        return { replyText: normalized.trim() };
    }

    const replyText = normalized.slice(0, match.index).trim();
    const quoteHeader = match[1]?.trim();
    const quotedText = (match[2] ?? "")
        .split("\n")
        .map((line) => line.replace(/^\s*> ?/, ""))
        .join("\n")
        .trim();

    return {
        replyText,
        quoteHeader,
        quotedText: quotedText || undefined,
    };
}
