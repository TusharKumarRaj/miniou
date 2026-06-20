import type { Metadata } from "next";

import { HowItWorksPage } from "~/components/landing/how-it-works-page";

export const metadata: Metadata = {
    title: "How it works — miniou",
    description: "Learn how miniou connects Gmail, Google Calendar, and AI chat in one workspace.",
};

export default function HowItWorksRoute() {
    return <HowItWorksPage />;
}
