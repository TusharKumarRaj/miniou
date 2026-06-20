import { generateObject, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type { PendingCalendarDraft } from "@repo/database/models/chat-session";

const EMAIL_INTENT_RE =
    /\b(send|email|e-mail|write to|mail to|compose|draft an? email|notify|invite|remind)\b/i;

const CALENDAR_INTENT_RE =
    /\b(calendar|google calendar|schedule|reschedule|book|appointment|meeting|call|sync|fix the time|set the time|move the meeting|update the meeting|change the time|event)\b/i;

const FALSE_CREATED_REPLY_RE =
    /\b(event has been created|meeting has been scheduled|I've scheduled|I scheduled|successfully scheduled|been added to your calendar|created the event|booked the meeting)\b/i;

const calendarDraftSchema = z.object({
    title: z.string().describe("Event title"),
    description: z.string().describe("Event description or agenda"),
    location: z.string().describe("Location or video link, empty string if none"),
    start: z.string().describe("Start time as ISO 8601 datetime in UTC"),
    end: z.string().describe("End time as ISO 8601 datetime in UTC"),
    timeZone: z.string().describe("IANA timezone, e.g. UTC or America/New_York"),
    attendeeEmails: z
        .array(z.string())
        .describe("Attendee email addresses mentioned in the conversation"),
});

/** Route calendar requests to the dedicated draft path — not email follow-ups. */
export function shouldAutoDraftCalendar(trimmedMessage: string): boolean {
    if (!trimmedMessage.trim()) return false;
    if (EMAIL_INTENT_RE.test(trimmedMessage)) return false;
    return CALENDAR_INTENT_RE.test(trimmedMessage);
}

export async function generateCalendarDraftFromChat(
    messages: ModelMessage[],
): Promise<PendingCalendarDraft> {
    const now = new Date().toISOString();

    const { object } = await generateObject({
        model: openai("gpt-4.1"),
        schema: calendarDraftSchema,
        system: `You draft Google Calendar events from the conversation.

Rules:
- Infer title, start, end, duration, attendees, location, and description from what the user said.
- Use exact dates and times the user mentioned. If they said "next Sunday at 2pm", use that — do not substitute "tomorrow".
- When details conflict, prefer the most recent user message.
- Default duration to 30 minutes when not specified.
- Return start/end as ISO 8601 UTC strings.
- Use UTC as timeZone unless the user specified a timezone.
- attendeeEmails should only include addresses from the conversation.
- Today (UTC): ${now}`,
        messages,
    });

    const title = object.title.trim();
    const start = object.start.trim();
    const end = object.end.trim();

    if (!title || !start || !end) {
        throw new Error("Could not generate calendar event draft. Please try again.");
    }

    return {
        title,
        description: object.description.trim(),
        location: object.location.trim(),
        start,
        end,
        timeZone: object.timeZone.trim() || "UTC",
        attendeeEmails: object.attendeeEmails.map((email) => email.trim()).filter(Boolean),
    };
}

export function sanitizeCalendarAssistantReply(reply: string, hasPendingDraft: boolean): string {
    if (!hasPendingDraft) return reply;

    if (FALSE_CREATED_REPLY_RE.test(reply)) {
        return CALENDAR_DRAFT_READY_REPLY;
    }

    return reply;
}

export const CALENDAR_DRAFT_READY_REPLY =
    "I've drafted the calendar event below — review it and click Create when ready.";
