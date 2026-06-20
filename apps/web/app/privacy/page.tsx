import type { Metadata } from "next";

import { LegalPage, LegalSection } from "~/components/legal/legal-page";

export const metadata: Metadata = {
    title: "Privacy Policy — miniou",
    description: "How miniou collects, uses, and protects your data.",
};

export default function PrivacyPage() {
    return (
        <LegalPage title="Privacy Policy">
            <LegalSection title="Overview">
                <p>
                    miniou (&quot;we&quot;, &quot;us&quot;) operates{" "}
                    <a
                        href="https://miniou.tusharcodes.tech"
                        className="text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                    >
                        miniou.tusharcodes.tech
                    </a>
                    , an AI workspace for Gmail and Google Calendar. This policy describes what
                    information we collect and how we use it.
                </p>
            </LegalSection>

            <LegalSection title="Information we collect">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong className="text-foreground">Account data:</strong> name, email address,
                        and password hash when you sign up with email, or profile information from
                        Google when you sign in with Google.
                    </li>
                    <li>
                        <strong className="text-foreground">Google integration data:</strong> when you
                        connect Gmail or Google Calendar, we store OAuth tokens needed to access your
                        mail and calendar on your behalf. We read and send email and manage calendar
                        events only as directed by you in the app or chat.
                    </li>
                    <li>
                        <strong className="text-foreground">Chat data:</strong> messages you send in
                        miniou chat and AI responses, stored to provide conversation history.
                    </li>
                    <li>
                        <strong className="text-foreground">Usage data:</strong> basic server logs (IP
                        address, request timestamps) for security and rate limiting.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="How we use your information">
                <p>
                    We use your information solely to operate miniou: authenticate you, sync Gmail and
                    Calendar, run AI-assisted actions you request, and keep the service secure. We do not
                    sell your personal information.
                </p>
            </LegalSection>

            <LegalSection title="Third-party services">
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        <strong className="text-foreground">Google:</strong> Gmail and Google Calendar
                        access via OAuth. Google&apos;s privacy policy applies to data held by Google.
                    </li>
                    <li>
                        <strong className="text-foreground">OpenAI:</strong> chat messages may be sent to
                        OpenAI to generate responses when you use AI features.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="Data retention and deletion">
                <p>
                    We retain account and integration data while your account is active. You can
                    disconnect Gmail and Calendar in Settings. To delete your account or request data
                    removal, contact us using the information on this site.
                </p>
            </LegalSection>

            <LegalSection title="Security">
                <p>
                    OAuth tokens and sensitive credentials are encrypted at rest. Access to production
                    systems is restricted. No method of transmission over the Internet is 100% secure;
                    we work to protect your data but cannot guarantee absolute security.
                </p>
            </LegalSection>

            <LegalSection title="Contact">
                <p>
                    For privacy questions, contact the operator of miniou at{" "}
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
