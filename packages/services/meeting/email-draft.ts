import { generateObject, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type { PendingEmailDraft } from "@repo/database/models/chat-session";

const EMAIL_ADDRESS_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

const EMAIL_INTENT_RE =
    /\b(send|email|e-mail|write to|mail to|compose|draft an? email|notify|invite|remind)\b/i;

const CALENDAR_INTENT_RE =
    /\b(calendar|google calendar|schedule|reschedule|book|event|fix the time|set the time|move the meeting|update the meeting|change the time)\b/i;

const PREVIEW_REQUEST_RE =
    /\b(show preview|give preview|preview|draft yourself|just draft)\b/i;

const FALSE_SENT_REPLY_RE =
    /\b(your email has been sent|email has been sent|I('ve| have) sent|successfully sent|I sent|letting them know|delivered your email|been sent to)\b/i;

const ASKS_SUBJECT_OR_BODY_RE =
    /\b(subject and body|subject and a brief|provide the subject|what would you like the subject|what would you like|brief message|create a default|your preference|message for the email|provide the details|please provide|specific details)\b/i;

const emailDraftSchema = z.object({
    to: z.string().describe("Recipient email address from the conversation"),
    subject: z.string().describe("Clear, concise email subject you write"),
    body: z.string().describe("Complete plain-text email body you write"),
});

export function extractEmailAddress(text: string): string | null {
    return text.match(EMAIL_ADDRESS_RE)?.[0] ?? null;
}

/** Only auto-draft when the current message is email-related — not calendar follow-ups. */
export function shouldAutoDraftEmail(trimmedMessage: string, conversationText: string): boolean {
    if (!trimmedMessage.trim()) return false;

    if (CALENDAR_INTENT_RE.test(trimmedMessage) && !EMAIL_INTENT_RE.test(trimmedMessage)) {
        return false;
    }

    if (PREVIEW_REQUEST_RE.test(trimmedMessage) && EMAIL_ADDRESS_RE.test(conversationText)) {
        return true;
    }

    if (!EMAIL_INTENT_RE.test(trimmedMessage)) {
        return false;
    }

    return EMAIL_ADDRESS_RE.test(trimmedMessage) || EMAIL_ADDRESS_RE.test(conversationText);
}

export function draftSourceMessage(trimmedMessage: string, conversationText: string): string {
    if (PREVIEW_REQUEST_RE.test(trimmedMessage)) {
        return conversationText;
    }

    return `${trimmedMessage}\n${conversationText}`.trim();
}

export async function generateEmailDraftFromChat(
    messages: ModelMessage[],
    recipientFallback: string | null,
    latestUserMessage: string,
): Promise<PendingEmailDraft> {
    const recipient = recipientFallback ?? extractEmailAddress(latestUserMessage) ?? "";

    const { object } = await generateObject({
        model: openai("gpt-4.1"),
        schema: emailDraftSchema,
        system: `You write email drafts from the conversation.

Rules:
- Write subject and body yourself. Never use placeholders like [date] or [name].
- Use the exact dates, days, and times the user mentioned. If they said "next Sunday", write "next Sunday" — do not substitute "tomorrow" or guess a different date.
- When details conflict, prefer the most recent user message over older messages.
- Keep tone professional and concise.
- Today (UTC): ${new Date().toISOString()}`,
        messages,
    });

    const to = (object.to.trim() || recipient).trim();
    const subject = object.subject.trim();
    const body = object.body.trim();

    if (!body) {
        throw new Error("Could not generate email draft. Please try again.");
    }

    return { to, subject: subject || "No subject", body };
}

export function sanitizeEmailAssistantReply(reply: string, hasPendingDraft: boolean): string {
    if (!hasPendingDraft) return reply;

    if (FALSE_SENT_REPLY_RE.test(reply) || ASKS_SUBJECT_OR_BODY_RE.test(reply)) {
        return DRAFT_READY_REPLY;
    }

    return reply;
}

export const DRAFT_READY_REPLY =
    "I've drafted the email below — review it and click Send when ready.";
