import { buildCorsairToolDefs, type CorsairToolDef } from "@corsair-dev/mcp";
import { tool } from "ai";
import { z } from "zod";

import { dynamicObject } from "../shared/dynamic-schema";
import { searchGmailRecipients } from "../gmail/client";

import type { PendingCalendarDraft } from "@repo/database/models/chat-session";

type TenantCorsair = ReturnType<typeof import("@repo/corsair").withUserTenant>;

const prepareGmailEmailInputSchema = dynamicObject({
    to: () => z.string().min(1).describe("Recipient email address"),
    subject: () => z.string().describe("Email subject line"),
    body: () => z.string().describe("Plain-text email body"),
});

const prepareCalendarEventInputSchema = dynamicObject({
    title: () => z.string().min(1).describe("Event title"),
    description: () => z.string().describe("Event description"),
    location: () => z.string().describe("Location or empty string"),
    start: () => z.string().describe("Start time ISO 8601 UTC"),
    end: () => z.string().describe("End time ISO 8601 UTC"),
    timeZone: () => z.string().describe("IANA timezone"),
    attendeeEmails: () => z.array(z.string()).describe("Attendee email addresses"),
});

const searchRecipientsInputSchema = dynamicObject({
    query: () =>
        z
            .string()
            .min(1)
            .describe("Name or email fragment to search in recent Gmail contacts"),
});

type PrepareEmailHandler = (draft: { to: string; subject: string; body: string }) => Promise<void>;
type PrepareCalendarHandler = (draft: PendingCalendarDraft) => Promise<void>;

const RUN_SCRIPT_GMAIL_SEND_MESSAGE =
    "Gmail is not available in run_script. Call prepare_gmail_email with to, subject, and body instead. The user must review and confirm the draft in the UI before it is sent.";

const RUN_SCRIPT_CALENDAR_MUTATION_MESSAGE =
    "Calendar create/update/delete is not available in run_script. Call prepare_google_calendar_event instead. The user must review and confirm the event in the UI before it is created.";

function blocksGmailSendScript(code: string) {
    const normalized = code.toLowerCase();

    if (/corsair\.gmail|gmail\.api/.test(normalized)) return true;
    if (/gmail\.api\.messages\.send/.test(normalized)) return true;
    if (/messages\.send\s*\(/.test(normalized) && /gmail/.test(normalized)) return true;
    if (/sendgmailemail/.test(normalized.replace(/[^a-z0-9.]/g, ""))) return true;

    return false;
}

function blocksCalendarMutationScript(code: string) {
    const normalized = code.toLowerCase();

    if (!/googlecalendar|google\.calendar/.test(normalized)) return false;

    if (/events\.(create|update|patch|delete|insert)/.test(normalized)) return true;
    if (/\.events\.create\s*\(/.test(normalized)) return true;
    if (/\.events\.update\s*\(/.test(normalized)) return true;
    if (/\.events\.delete\s*\(/.test(normalized)) return true;

    return false;
}

function mcpResultToText(result: Awaited<ReturnType<CorsairToolDef["handler"]>>) {
    const text =
        result.content
            ?.map((part) => (part.type === "text" ? part.text : ""))
            .join("\n")
            .trim() ?? "";

    if (result.isError) {
        throw new Error(text || "Corsair tool failed");
    }

    return text;
}

export function buildMeetingTools(
    tenantCorsair: TenantCorsair,
    options: {
        onPrepareEmail: PrepareEmailHandler;
        onPrepareCalendar: PrepareCalendarHandler;
    },
) {
    const defs = buildCorsairToolDefs({
        corsair: tenantCorsair,
        setup: false,
    });

    const corsairTools = Object.fromEntries(
        defs.map((def) => {
            if (def.name === "run_script") {
                return [
                    def.name,
                    tool({
                        description: `${def.description} IMPORTANT: Never send Gmail or mutate Google Calendar with this tool — use prepare_gmail_email or prepare_google_calendar_event instead. Use run_script only to read/list calendar data.`,
                        inputSchema: z.object(def.shape),
                        execute: async (args) => {
                            const { code } = args as { code: string };
                            if (blocksGmailSendScript(code)) {
                                return RUN_SCRIPT_GMAIL_SEND_MESSAGE;
                            }
                            if (blocksCalendarMutationScript(code)) {
                                return RUN_SCRIPT_CALENDAR_MUTATION_MESSAGE;
                            }

                            return mcpResultToText(await def.handler(args));
                        },
                    }),
                ];
            }

            return [
                def.name,
                tool({
                    description: def.description,
                    inputSchema: z.object(def.shape),
                    execute: async (args) => mcpResultToText(await def.handler(args)),
                }),
            ];
        }),
    );

    return {
        ...corsairTools,
        search_recipients: tool({
            description:
                "Search people the user has recently emailed or received mail from (Gmail From/To/Cc). Use when the user gives a person's name instead of a full email address, or when you need to resolve who they mean before sending.",
            inputSchema: searchRecipientsInputSchema,
            execute: async (input) => {
                const results = await searchGmailRecipients(tenantCorsair, input.query, {
                    limit: 8,
                });

                if (results.length === 0) {
                    return `No recipients found matching "${input.query}". Ask the user for the full email address.`;
                }

                return [
                    `Found ${results.length} recipient(s) matching "${input.query}":`,
                    ...results.map((r, i) => `${i + 1}. ${r.name} <${r.email}>`),
                ].join("\n");
            },
        }),
        prepare_gmail_email: tool({
            description:
                "REQUIRED to create any email. Saves a draft in the Gmail-style compose UI for user review — never sends. You write subject and body. Call immediately when the user gives a recipient and any topic or date — do not ask for subject/body/time. Use the exact date or day the user mentioned (e.g. next Sunday, not tomorrow unless they said tomorrow).",
            inputSchema: prepareGmailEmailInputSchema,
            execute: async (input) => {
                await options.onPrepareEmail({
                    to: input.to.trim(),
                    subject: input.subject.trim(),
                    body: input.body.trim(),
                });

                return `Email draft saved for ${input.to.trim()}. The compose preview is shown in the UI. Tell the user to review it and click Send — do not repeat the subject or body in chat.`;
            },
        }),
        prepare_google_calendar_event: tool({
            description:
                "REQUIRED to create any calendar event. Saves a draft in the calendar preview UI for user review — never creates directly. You write title, times, attendees, and description. Call immediately when the user asks to schedule/book/fix a meeting — do not ask for missing details if you can infer them. Use exact dates the user mentioned.",
            inputSchema: prepareCalendarEventInputSchema,
            execute: async (input) => {
                await options.onPrepareCalendar({
                    title: input.title.trim(),
                    description: input.description.trim(),
                    location: input.location.trim(),
                    start: input.start.trim(),
                    end: input.end.trim(),
                    timeZone: input.timeZone.trim() || "UTC",
                    attendeeEmails: input.attendeeEmails.map((email) => email.trim()).filter(Boolean),
                });

                return `Calendar event draft saved for "${input.title.trim()}". The preview is shown in the UI. Tell the user to review it and click Create — do not repeat event details in chat.`;
            },
        }),
    };
}
