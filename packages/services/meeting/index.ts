import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { and, desc, eq } from "@repo/database";
import { db } from "@repo/database";
import { chatMessagesTable } from "@repo/database/models/chat-message";
import { chatSessionsTable } from "@repo/database/models/chat-session";
import { withUserTenant } from "@repo/corsair";

import { env } from "../env";
import IntegrationService from "../integration";

import { buildMeetingTools } from "./corsair-tools";
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
} from "./model";

const MEETING_SYSTEM_PROMPT = `You are miniou, an AI assistant with access to the user's Gmail and Google Calendar through Corsair.

You can help with two things:

**1. Send emails via Gmail**
When the user asks to send, write, draft, or compose an email:
- If they give a **name** but not a full email (e.g. "email John", "send Sarah a note"), call \`search_recipients\` first with that name
- If \`search_recipients\` returns **one clear match**, use that email in \`send_gmail_email\`
- If it returns **multiple matches**, ask the user which one they mean (list the options)
- If it returns **no matches**, ask for the full email address
- ALWAYS call \`send_gmail_email\` with \`to\`, \`subject\`, and \`body\` once you know the recipient
- Do NOT ask for confirmation if the user already provided those fields — send immediately
- Do NOT use run_script for simple email sends
- If subject or body is missing, ask once for the missing fields
- Confirm what you sent after succeeding

**2. Schedule meetings on Google Calendar**
When the user asks to schedule, book, fix, reschedule, or cancel a meeting:
- Create or update the event on their primary calendar with correct time, duration, and attendees
- Optionally send a Gmail message to attendees if they ask
- If attendee email or time is missing, ask instead of guessing

Use the Corsair tools available to you:
- list_operations: discover Gmail and Google Calendar endpoints
- get_schema: inspect parameters before calling an API
- run_script: execute JavaScript with \`corsair\` in scope to call gmail.* and googlecalendar.*

Refuse only clearly unrelated requests (code, homework, general knowledge). Gmail and Calendar tasks are always in scope.`;

function buildSystemPrompt(options: { calendarConnected: boolean }) {
    const today = new Date().toISOString();
    const calendarNote = options.calendarConnected
        ? ""
        : "\n\nGoogle Calendar is NOT connected for this user. You can send Gmail messages but cannot create or update calendar events until they connect Calendar in settings.";

    return `${MEETING_SYSTEM_PROMPT}${calendarNote}\n\nToday's date (UTC): ${today}`;
}

function sessionTitleFromMessage(message: string) {
    const trimmed = message.trim().replace(/\s+/g, " ");
    if (!trimmed) return "New chat";
    return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
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
    ) {
        await db.insert(chatMessagesTable).values({ userId, sessionId, role, content });
    }

    private async loadSessionMessages(sessionId: string, limit = 50) {
        const messages = await db
            .select({
                id: chatMessagesTable.id,
                role: chatMessagesTable.role,
                content: chatMessagesTable.content,
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

    public async sendMessage(userId: string, payload: SendMessageInputModel) {
        const { sessionId, message } = await sendMessageInputModel.parseAsync(payload);

        const session = await this.getSessionForUser(userId, sessionId);

        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.gmail) {
            throw new Error("Connect Gmail in settings before using chat.");
        }

        if (!env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured on the server.");
        }

        await assertMeetingRateLimit(userId);
        await assertMeetingScope(message);

        await this.saveMessage(userId, sessionId, "user", message);

        if (session.title === "New chat" || session.title === "General") {
            await db
                .update(chatSessionsTable)
                .set({ title: sessionTitleFromMessage(message), updatedAt: new Date() })
                .where(eq(chatSessionsTable.id, sessionId));
        } else {
            await this.touchSession(sessionId);
        }

        const history = await this.loadSessionMessages(sessionId, 40);
        const coreMessages = history.map((row) => ({
            role: row.role,
            content: row.content,
        }));

        const tenant = withUserTenant(userId);
        const tools = buildMeetingTools(tenant);

        const { text } = await generateText({
            model: openai("gpt-4.1"),
            system: buildSystemPrompt({ calendarConnected: status.googlecalendar }),
            messages: coreMessages,
            tools,
            stopWhen: stepCountIs(15),
        });

        const reply = text.trim() || "Done.";

        await this.saveMessage(userId, sessionId, "assistant", reply);
        await this.touchSession(sessionId);

        return { reply };
    }

    public async getHistory(userId: string, payload: GetHistoryInputModel) {
        const { sessionId, limit } = await getHistoryInputModel.parseAsync(payload);

        await this.getSessionForUser(userId, sessionId);

        const messages = await this.loadSessionMessages(sessionId, limit);

        return { messages };
    }
}
