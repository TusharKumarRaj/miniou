const EMAIL_INTENT_RE =
    /\b(send|email|e-mail|write to|mail to|compose|draft an? email|notify|invite|remind)\b/i;

const CALENDAR_INTENT_RE =
    /\b(calendar|google calendar|schedule|reschedule|book|appointment|meeting|call|sync|fix the time|set the time|move the meeting|update the meeting|change the time|event)\b/i;

/** Route to prepareCalendarDraft instead of the general chat agent. */
export function shouldPrepareCalendarDraft(message: string): boolean {
    const trimmed = message.trim();
    if (!trimmed) return false;
    if (EMAIL_INTENT_RE.test(trimmed)) return false;
    return CALENDAR_INTENT_RE.test(trimmed);
}
