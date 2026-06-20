const EMAIL_ADDRESS_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

const EMAIL_INTENT_RE =
    /\b(send|email|e-mail|write to|mail to|compose|draft an? email|notify|invite|remind)\b/i;

const CALENDAR_INTENT_RE =
    /\b(calendar|google calendar|schedule|reschedule|book|event|fix the time|set the time|move the meeting|update the meeting|change the time)\b/i;

const PREVIEW_REQUEST_RE = /\b(show preview|give preview|preview|draft yourself|just draft)\b/i;

/** Route to prepareEmailDraft instead of the general chat agent. */
export function shouldPrepareEmailDraft(message: string, conversationText: string): boolean {
    const trimmed = message.trim();
    if (!trimmed) return false;

    if (CALENDAR_INTENT_RE.test(trimmed) && !EMAIL_INTENT_RE.test(trimmed)) {
        return false;
    }

    if (PREVIEW_REQUEST_RE.test(trimmed) && EMAIL_ADDRESS_RE.test(conversationText)) {
        return true;
    }

    if (!EMAIL_INTENT_RE.test(trimmed)) {
        return false;
    }

    return EMAIL_ADDRESS_RE.test(trimmed) || EMAIL_ADDRESS_RE.test(conversationText);
}

export function extractEmailAddress(text: string): string | null {
    return text.match(EMAIL_ADDRESS_RE)?.[0] ?? null;
}
