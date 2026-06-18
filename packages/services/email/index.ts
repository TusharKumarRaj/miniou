import { logger } from "@repo/logger";

import { env } from "../env";

type SendEmailInput = {
    to: string;
    subject: string;
    html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
    const from = env.EMAIL_FROM ?? "miniou <onboarding@resend.dev>";
    const apiKey = env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        logger.warn(`Email not sent (RESEND_API_KEY missing). To: ${to} Subject: ${subject}`);
        logger.info(`Email body preview: ${html}`);
        return;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to send email (${response.status}): ${text}`);
    }
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
    await sendEmail({
        to,
        subject: "Verify your miniou account",
        html: `
            <p>Thanks for signing up for miniou.</p>
            <p><a href="${verifyUrl}">Click here to verify your email</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not create an account, you can ignore this email.</p>
        `,
    });
}
