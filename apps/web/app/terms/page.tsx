import type { Metadata } from "next";

import { LegalPage, LegalSection } from "~/components/legal/legal-page";

export const metadata: Metadata = {
    title: "Terms of Service — miniou",
    description: "Terms for using the miniou AI workspace.",
};

export default function TermsPage() {
    return (
        <LegalPage title="Terms of Service">
            <LegalSection title="Agreement">
                <p>
                    By accessing or using miniou at{" "}
                    <a
                        href="https://miniou.tusharcodes.tech"
                        className="text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                    >
                        miniou.tusharcodes.tech
                    </a>
                    , you agree to these Terms. If you do not agree, do not use the service.
                </p>
            </LegalSection>

            <LegalSection title="The service">
                <p>
                    miniou lets you connect Gmail and Google Calendar and use AI-assisted tools to read
                    and send email and manage calendar events. Features may change over time. Some
                    features require a connected Google account and an active internet connection.
                </p>
            </LegalSection>

            <LegalSection title="Your account">
                <ul className="list-disc space-y-2 pl-5">
                    <li>You are responsible for keeping your login credentials secure.</li>
                    <li>You must provide accurate account information.</li>
                    <li>
                        You are responsible for actions taken through your account, including emails
                        sent and calendar events created via miniou.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="Acceptable use">
                <p>You agree not to:</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                    <li>Use miniou for unlawful, abusive, or spam activity.</li>
                    <li>Attempt to access other users&apos; data or bypass security controls.</li>
                    <li>Reverse engineer or overload the service in ways that harm others.</li>
                </ul>
            </LegalSection>

            <LegalSection title="Google integrations">
                <p>
                    Connecting Gmail or Google Calendar requires authorizing miniou through Google
                    OAuth. Your use of Google services remains subject to Google&apos;s terms and
                    policies. You can revoke access at any time in miniou Settings or in your Google
                    Account security settings.
                </p>
            </LegalSection>

            <LegalSection title="AI features">
                <p>
                    AI-generated content may be inaccurate or incomplete. Review important emails and
                    calendar changes before sending or confirming. We are not liable for errors in
                    AI-assisted output.
                </p>
            </LegalSection>

            <LegalSection title="Disclaimer">
                <p>
                    miniou is provided &quot;as is&quot; without warranties of any kind. We do not
                    guarantee uninterrupted or error-free operation.
                </p>
            </LegalSection>

            <LegalSection title="Limitation of liability">
                <p>
                    To the fullest extent permitted by law, miniou and its operator are not liable for
                    indirect, incidental, or consequential damages arising from your use of the service.
                </p>
            </LegalSection>

            <LegalSection title="Changes">
                <p>
                    We may update these Terms from time to time. Continued use after changes are posted
                    constitutes acceptance of the updated Terms.
                </p>
            </LegalSection>

            <LegalSection title="Contact">
                <p>
                    Questions about these Terms:{" "}
                    <a
                        href="mailto:support@tusharcodes.tech"
                        className="text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                    >
                        support@tusharcodes.tech
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalPage>
    );
}
