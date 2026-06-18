import { buildCorsairToolDefs, type CorsairToolDef } from "@corsair-dev/mcp";
import { tool } from "ai";
import { z } from "zod";

import { dynamicObject } from "../shared/dynamic-schema";
import { searchGmailRecipients, sendGmailEmail } from "../gmail/client";

type TenantCorsair = ReturnType<typeof import("@repo/corsair").withUserTenant>;

const sendGmailEmailInputSchema = dynamicObject({
    to: () => z.string().min(1).describe("Recipient email address"),
    subject: () => z.string().describe("Email subject line"),
    body: () => z.string().describe("Plain-text email body"),
});

const searchRecipientsInputSchema = dynamicObject({
    query: () =>
        z
            .string()
            .min(1)
            .describe("Name or email fragment to search in recent Gmail contacts"),
});

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

export function buildMeetingTools(tenantCorsair: TenantCorsair) {
    const defs = buildCorsairToolDefs({
        corsair: tenantCorsair,
        setup: false,
    });

    const corsairTools = Object.fromEntries(
        defs.map((def) => [
            def.name,
            tool({
                description: def.description,
                inputSchema: z.object(def.shape),
                execute: async (args) => mcpResultToText(await def.handler(args)),
            }),
        ]),
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
                    ...results.map(
                        (r, i) => `${i + 1}. ${r.name} <${r.email}>`,
                    ),
                ].join("\n");
            },
        }),
        send_gmail_email: tool({
            description:
                "Send a plain-text email through the user's connected Gmail account. Use this for all email send requests.",
            inputSchema: sendGmailEmailInputSchema,
            execute: async (input) => {
                try {
                    const result = await sendGmailEmail(tenantCorsair, input);
                    return `Email sent to ${result.to} with subject "${result.subject}" (message id: ${result.messageId ?? "unknown"}).`;
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    throw new Error(`Failed to send Gmail message: ${message}`);
                }
            },
        }),
    };
}
