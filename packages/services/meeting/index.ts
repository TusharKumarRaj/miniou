import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { and, desc, eq } from "@repo/database";
import { db } from "@repo/database";
import { chatMessagesTable } from "@repo/database/models/chat-message";
import type { ChatMessageAttachment } from "@repo/database/models/chat-message";
import { chatSessionsTable } from "@repo/database/models/chat-session";
import type { PendingEmailDraft, PendingCalendarDraft } from "@repo/database/models/chat-session";
import { withUserTenant } from "@repo/corsair";

import { env } from "../env";
import IntegrationService from "../integration";
import { sendGmailEmail } from "../gmail/client";
import { createCalendarEvent } from "../calendar/client";

import {
    attachmentSummary,
    buildModelMessages,
    normalizeChatAttachments,
} from "./attachments";
import { buildMeetingTools } from "./corsair-tools";
import {
    DRAFT_READY_REPLY,
    draftSourceMessage,
    extractEmailAddress,
    generateEmailDraftFromChat,
    shouldAutoDraftEmail,
    sanitizeEmailAssistantReply,
} from "./email-draft";
import {
    CALENDAR_DRAFT_READY_REPLY,
    generateCalendarDraftFromChat,
    sanitizeCalendarAssistantReply,
    shouldAutoDraftCalendar,
} from "./calendar-draft";
import { assertMeetingScope } from "./guardrails";
import { assertMeetingRateLimit } from "./rate-limit";
import {
    createSessionInputModel,
    type CreateSessionInputModel,
    getHistoryInputModel,
    type GetHistoryInputModel,
    listSessionsInputModel,
    type ListSessionsInputModel,
    sendMessageInputModel,
    type SendMessageInputModel,
    confirmEmailSendInputModel,
    type ConfirmEmailSendInputModel,
    cancelEmailPreviewInputModel,
    type CancelEmailPreviewInputModel,
    confirmCalendarEventInputModel,
    type ConfirmCalendarEventInputModel,
    cancelCalendarPreviewInputModel,
    type CancelCalendarPreviewInputModel,
} from "./model";

const MEETING_SYSTEM_PROMPT = `You are miniou, an AI assistant with access to the user's Gmail and Google Calendar through Corsair.

You can help with two things:

**1. Send emails via Gmail**
When the user asks to send, write, draft, or preview an email:

**ALWAYS call \`prepare_gmail_email\` immediately** — never ask for subject, body, time, or other details. Write subject and body yourself from whatever the user said (even if vague).

- User reviews the compose preview in the UI and clicks Send — you cannot send email
- NEVER say the email was sent
- Do NOT paste the full subject/body in chat — keep your reply to one short sentence
- Do NOT use run_script for Gmail

**2. Schedule meetings on Google Calendar**
When the user asks to schedule, book, fix, reschedule, or cancel a meeting:

**ALWAYS call \`prepare_google_calendar_event\` immediately** — never ask for title, time, or attendees if you can infer them. Write event details yourself from whatever the user said.

- User reviews the calendar preview in the UI and clicks Create — you cannot create events directly
- NEVER say the event was created or scheduled
- Do NOT paste full event details in chat — keep your reply to one short sentence
- Do NOT use run_script to create, update, or delete calendar events
- If they also want attendees notified by email, use prepare_gmail_email after the calendar preview

Use the Corsair tools available to you:
- prepare_gmail_email: draft emails for user review (never sends directly)
- prepare_google_calendar_event: draft calendar events for user review (never creates directly)
- search_recipients: resolve a person's name to an email address
- list_operations: discover Google Calendar endpoints
- get_schema: inspect parameters before calling an API
- run_script: read/list calendar data only — never for Gmail sends or calendar mutations

Refuse only clearly unrelated requests (code, homework, general knowledge). Gmail and Calendar tasks are always in scope.

When the user attaches files (images, PDFs, or text files), use them as context for email or calendar tasks when relevant.`;

function buildSystemPrompt(options: { calendarConnected: boolean }) {
    const today = new Date().toISOString();
    const calendarNote = options.calendarConnected
        ? ""
        : "\n\nGoogle Calendar is NOT connected for this user. You can send Gmail messages but cannot create or update calendar events until they connect Calendar in settings.";

    return `${MEETING_SYSTEM_PROMPT}${calendarNote}\n\nToday's date (UTC): ${today}`;
}

function sessionTitleFromMessage(message: string, attachments: ChatMessageAttachment[] | null) {
    const trimmed = message.trim().replace(/\s+/g, " ");
    const source =
        trimmed ||
        attachments?.[0]?.name ||
        attachmentSummary(attachments).replace(/^\[Attached:\s*|\]$/g, "") ||
        "New chat";
    if (!source) return "New chat";
    return source.length > 48 ? `${source.slice(0, 48)}…` : source;
}

export default class MeetingService {
    private integrationService = new IntegrationService();

    private async getSessionForUser(userId: string, sessionId: string) {
        const [session] = await db
            .select()
            .from(chatSessionsTable)
            .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)))
            .limit(1);

        if (!session) {
            throw new Error("Chat session not found.");
        }

        return session;
    }

    private async touchSession(sessionId: string) {
        await db
            .update(chatSessionsTable)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessionsTable.id, sessionId));
    }

    private async saveMessage(
        userId: string,
        sessionId: string,
        role: "user" | "assistant",
        content: string,
        attachments: ChatMessageAttachment[] | null = null,
    ) {
        await db.insert(chatMessagesTable).values({ userId, sessionId, role, content, attachments });
    }

    private async loadSessionMessages(sessionId: string, limit = 50) {
        const messages = await db
            .select({
                id: chatMessagesTable.id,
                role: chatMessagesTable.role,
                content: chatMessagesTable.content,
                attachments: chatMessagesTable.attachments,
                createdAt: chatMessagesTable.createdAt,
                sessionId: chatMessagesTable.sessionId,
            })
            .from(chatMessagesTable)
            .where(eq(chatMessagesTable.sessionId, sessionId))
            .orderBy(desc(chatMessagesTable.createdAt))
            .limit(limit);

        return messages.reverse();
    }

    public async listSessions(userId: string, payload: ListSessionsInputModel) {
        const { limit } = await listSessionsInputModel.parseAsync(payload);

        const sessions = await db
            .select({
                id: chatSessionsTable.id,
                title: chatSessionsTable.title,
                createdAt: chatSessionsTable.createdAt,
                updatedAt: chatSessionsTable.updatedAt,
            })
            .from(chatSessionsTable)
            .where(eq(chatSessionsTable.userId, userId))
            .orderBy(desc(chatSessionsTable.updatedAt))
            .limit(limit);

        return { sessions };
    }

    public async createSession(userId: string, payload: CreateSessionInputModel) {
        const { title } = await createSessionInputModel.parseAsync(payload);

        const [session] = await db
            .insert(chatSessionsTable)
            .values({
                userId,
                title: title?.trim() || "New chat",
            })
            .returning({
                id: chatSessionsTable.id,
                title: chatSessionsTable.title,
                createdAt: chatSessionsTable.createdAt,
                updatedAt: chatSessionsTable.updatedAt,
            });

        if (!session) {
            throw new Error("Failed to create chat session.");
        }

        return { session };
    }

    private async setPendingEmail(sessionId: string, draft: PendingEmailDraft | null) {
        await db
            .update(chatSessionsTable)
            .set({ pendingEmail: draft, pendingCalendar: null, updatedAt: new Date() })
            .where(eq(chatSessionsTable.id, sessionId));
    }

    private async getPendingEmail(sessionId: string): Promise<PendingEmailDraft | null> {
        const [session] = await db
            .select({ pendingEmail: chatSessionsTable.pendingEmail })
            .from(chatSessionsTable)
            .where(eq(chatSessionsTable.id, sessionId))
            .limit(1);

        return session?.pendingEmail ?? null;
    }

    private async setPendingCalendar(sessionId: string, draft: PendingCalendarDraft | null) {
        await db
            .update(chatSessionsTable)
            .set({ pendingCalendar: draft, pendingEmail: null, updatedAt: new Date() })
            .where(eq(chatSessionsTable.id, sessionId));
    }

    private async getPendingCalendar(sessionId: string): Promise<PendingCalendarDraft | null> {
        const [session] = await db
            .select({ pendingCalendar: chatSessionsTable.pendingCalendar })
            .from(chatSessionsTable)
            .where(eq(chatSessionsTable.id, sessionId))
            .limit(1);

        return session?.pendingCalendar ?? null;
    }

    private async createEmailDraft(
        sessionId: string,
        history: Awaited<ReturnType<typeof this.loadSessionMessages>>,
        trimmedMessage: string,
        conversationText: string,
    ): Promise<PendingEmailDraft> {
        const coreMessages = buildModelMessages(history);
        const recipient =
            extractEmailAddress(trimmedMessage) ??
            extractEmailAddress(conversationText) ??
            extractEmailAddress(draftSourceMessage(trimmedMessage, conversationText));

        const draft = await generateEmailDraftFromChat(coreMessages, recipient, trimmedMessage);

        try {
            await this.setPendingEmail(sessionId, draft);
        } catch {
            // Return draft in response even if DB column is unavailable.
        }

        return draft;
    }

    private async createCalendarDraft(
        sessionId: string,
        history: Awaited<ReturnType<typeof this.loadSessionMessages>>,
    ): Promise<PendingCalendarDraft> {
        const coreMessages = buildModelMessages(history);
        const draft = await generateCalendarDraftFromChat(coreMessages);

        try {
            await this.setPendingCalendar(sessionId, draft);
        } catch {
            // Return draft in response even if DB column is unavailable.
        }

        return draft;
    }

    public async confirmEmailSend(userId: string, payload: ConfirmEmailSendInputModel) {
        const parsed = await confirmEmailSendInputModel.parseAsync(payload);
        const { sessionId } = parsed;
        await this.getSessionForUser(userId, sessionId);

        const pending = await this.getPendingEmail(sessionId);
        if (!pending) {
            throw new Error("No email draft is waiting for confirmation.");
        }

        const emailToSend = parsed.draft ?? pending;
        const to = emailToSend.to.trim();
        const subject = emailToSend.subject.trim();
        const body = emailToSend.body.trim();

        if (!to) {
            throw new Error("Recipient is required.");
        }

        if (!body) {
            throw new Error("Email body is required.");
        }

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.gmail) {
            throw new Error("Connect Gmail in settings before sending email.");
        }

        const tenant = withUserTenant(userId);
        const result = await sendGmailEmail(tenant, { to, subject, body });
        await this.setPendingEmail(sessionId, null);

        const reply = `Email sent to ${result.to} with subject "${result.subject}".`;
        await this.saveMessage(userId, sessionId, "assistant", reply);
        await this.touchSession(sessionId);

        return { reply };
    }

    public async cancelEmailPreview(userId: string, payload: CancelEmailPreviewInputModel) {
        const { sessionId } = await cancelEmailPreviewInputModel.parseAsync(payload);
        await this.getSessionForUser(userId, sessionId);
        await this.setPendingEmail(sessionId, null);
        return { ok: true as const };
    }

    public async prepareEmailDraft(userId: string, payload: SendMessageInputModel) {
        const parsed = await sendMessageInputModel.parseAsync(payload);
        const { sessionId, message } = parsed;

        if (message.trim().length === 0) {
            throw new Error("Message is required.");
        }

        const session = await this.getSessionForUser(userId, sessionId);

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.gmail) {
            throw new Error("Connect Gmail in settings before using chat.");
        }

        if (!env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured on the server.");
        }

        await assertMeetingRateLimit(userId);

        const trimmedMessage = message.trim();
        await assertMeetingScope(trimmedMessage);

        await this.saveMessage(userId, sessionId, "user", trimmedMessage);

        if (session.title === "New chat" || session.title === "General") {
            await db
                .update(chatSessionsTable)
                .set({ title: sessionTitleFromMessage(trimmedMessage, null), updatedAt: new Date() })
                .where(eq(chatSessionsTable.id, sessionId));
        } else {
            await this.touchSession(sessionId);
        }

        const history = await this.loadSessionMessages(sessionId, 40);
        const conversationText = history.map((entry) => entry.content).join("\n");
        const draft = await this.createEmailDraft(sessionId, history, trimmedMessage, conversationText);

        await this.saveMessage(userId, sessionId, "assistant", DRAFT_READY_REPLY);
        await this.touchSession(sessionId);

        return { reply: DRAFT_READY_REPLY, pendingEmail: draft };
    }

    public async prepareCalendarDraft(userId: string, payload: SendMessageInputModel) {
        const parsed = await sendMessageInputModel.parseAsync(payload);
        const { sessionId, message } = parsed;

        if (message.trim().length === 0) {
            throw new Error("Message is required.");
        }

        const session = await this.getSessionForUser(userId, sessionId);

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.googlecalendar) {
            throw new Error("Connect Google Calendar in settings before scheduling events.");
        }

        if (!env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured on the server.");
        }

        await assertMeetingRateLimit(userId);

        const trimmedMessage = message.trim();
        await assertMeetingScope(trimmedMessage);

        await this.saveMessage(userId, sessionId, "user", trimmedMessage);

        if (session.title === "New chat" || session.title === "General") {
            await db
                .update(chatSessionsTable)
                .set({ title: sessionTitleFromMessage(trimmedMessage, null), updatedAt: new Date() })
                .where(eq(chatSessionsTable.id, sessionId));
        } else {
            await this.touchSession(sessionId);
        }

        const history = await this.loadSessionMessages(sessionId, 40);
        const draft = await this.createCalendarDraft(sessionId, history);

        await this.saveMessage(userId, sessionId, "assistant", CALENDAR_DRAFT_READY_REPLY);
        await this.touchSession(sessionId);

        return { reply: CALENDAR_DRAFT_READY_REPLY, pendingCalendar: draft };
    }

    public async confirmCalendarEvent(userId: string, payload: ConfirmCalendarEventInputModel) {
        const parsed = await confirmCalendarEventInputModel.parseAsync(payload);
        const { sessionId } = parsed;
        await this.getSessionForUser(userId, sessionId);

        const pending = await this.getPendingCalendar(sessionId);
        if (!pending) {
            throw new Error("No calendar event is waiting for confirmation.");
        }

        const eventToCreate = parsed.draft ?? pending;
        const title = eventToCreate.title.trim();
        const start = eventToCreate.start.trim();
        const end = eventToCreate.end.trim();

        if (!title || !start || !end) {
            throw new Error("Event title, start, and end are required.");
        }

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.googlecalendar) {
            throw new Error("Connect Google Calendar in settings before creating events.");
        }

        const tenant = withUserTenant(userId);
        const result = await createCalendarEvent(tenant, {
            title,
            description: eventToCreate.description.trim() || undefined,
            location: eventToCreate.location.trim() || undefined,
            start,
            end,
            timeZone: eventToCreate.timeZone.trim() || "UTC",
            attendeeEmails: eventToCreate.attendeeEmails,
        });

        await this.setPendingCalendar(sessionId, null);

        const reply = `Calendar event "${result.title}" created for ${result.start}.`;
        await this.saveMessage(userId, sessionId, "assistant", reply);
        await this.touchSession(sessionId);

        return { reply };
    }

    public async cancelCalendarPreview(userId: string, payload: CancelCalendarPreviewInputModel) {
        const { sessionId } = await cancelCalendarPreviewInputModel.parseAsync(payload);
        await this.getSessionForUser(userId, sessionId);
        await this.setPendingCalendar(sessionId, null);
        return { ok: true as const };
    }

    public async sendMessage(userId: string, payload: SendMessageInputModel) {
        const parsed = await sendMessageInputModel.parseAsync(payload);
        const { sessionId, message } = parsed;
        const attachments = normalizeChatAttachments(parsed.attachments) ?? [];

        if (message.trim().length === 0 && attachments.length === 0) {
            throw new Error("Message or at least one attachment is required.");
        }

        const session = await this.getSessionForUser(userId, sessionId);

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.gmail) {
            throw new Error("Connect Gmail in settings before using chat.");
        }

        if (!env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured on the server.");
        }

        await assertMeetingRateLimit(userId);

        const trimmedMessage = message.trim();
        const scopeMessage = [trimmedMessage, attachmentSummary(attachments)].filter(Boolean).join("\n");
        await assertMeetingScope(scopeMessage, { hasAttachments: Boolean(attachments?.length) });

        const storedContent = trimmedMessage || attachmentSummary(attachments);
        await this.saveMessage(userId, sessionId, "user", storedContent, attachments);

        if (session.title === "New chat" || session.title === "General") {
            await db
                .update(chatSessionsTable)
                .set({ title: sessionTitleFromMessage(trimmedMessage, attachments), updatedAt: new Date() })
                .where(eq(chatSessionsTable.id, sessionId));
        } else {
            await this.touchSession(sessionId);
        }

        const history = await this.loadSessionMessages(sessionId, 40);
        const coreMessages = buildModelMessages(history);
        const conversationText = history.map((entry) => entry.content).join("\n");
        const autoDraftEmail = shouldAutoDraftEmail(trimmedMessage, conversationText);
        const autoDraftCalendar =
            status.googlecalendar && shouldAutoDraftCalendar(trimmedMessage);

        if (autoDraftEmail) {
            const draft = await this.createEmailDraft(
                sessionId,
                history,
                trimmedMessage,
                conversationText,
            );

            await this.saveMessage(userId, sessionId, "assistant", DRAFT_READY_REPLY);
            await this.touchSession(sessionId);
            return { reply: DRAFT_READY_REPLY, pendingEmail: draft };
        }

        if (autoDraftCalendar) {
            const draft = await this.createCalendarDraft(sessionId, history);

            await this.saveMessage(userId, sessionId, "assistant", CALENDAR_DRAFT_READY_REPLY);
            await this.touchSession(sessionId);
            return { reply: CALENDAR_DRAFT_READY_REPLY, pendingCalendar: draft };
        }

        const tenant = withUserTenant(userId);
        const tools = buildMeetingTools(tenant, {
            onPrepareEmail: async (draft) => {
                await this.setPendingEmail(sessionId, draft);
            },
            onPrepareCalendar: async (draft) => {
                await this.setPendingCalendar(sessionId, draft);
            },
        });

        const { text } = await generateText({
            model: openai("gpt-4.1"),
            system: buildSystemPrompt({ calendarConnected: status.googlecalendar }),
            messages: coreMessages,
            tools,
            stopWhen: stepCountIs(15),
        });

        let reply = text.trim() || "Done.";
        const pendingEmail = await this.getPendingEmail(sessionId);
        const pendingCalendar = await this.getPendingCalendar(sessionId);

        reply = sanitizeEmailAssistantReply(reply, Boolean(pendingEmail));
        reply = sanitizeCalendarAssistantReply(reply, Boolean(pendingCalendar));

        await this.saveMessage(userId, sessionId, "assistant", reply);
        await this.touchSession(sessionId);

        return { reply, pendingEmail, pendingCalendar };
    }

    public async getHistory(userId: string, payload: GetHistoryInputModel) {
        const { sessionId, limit } = await getHistoryInputModel.parseAsync(payload);

        await this.getSessionForUser(userId, sessionId);

        const messages = await this.loadSessionMessages(sessionId, limit);
        const pendingEmail = await this.getPendingEmail(sessionId);
        const pendingCalendar = await this.getPendingCalendar(sessionId);

        return { messages, pendingEmail, pendingCalendar };
    }
}
