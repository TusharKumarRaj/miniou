"use client";

import { CoachmarkTour, type CoachmarkStep } from "~/components/onboarding/coachmark-tour";
import { CHAT_COACHMARKS_STORAGE_KEY } from "~/lib/coachmarks";

const CHAT_COACHMARK_STEPS: CoachmarkStep[] = [
    {
        id: "chat-composer",
        title: "Chat",
        body: "Talk to your AI agent here. Send emails, check your calendar, and ask for help in plain language.",
    },
    {
        id: "chat-attach",
        title: "Attach file",
        body: "Add images, PDFs, or text files when you want the assistant to use them in a reply.",
    },
    {
        id: "chat-schedule",
        title: "Schedule",
        body: "Start a calendar request quickly. Use this when you want to plan or update a meeting.",
    },
    {
        id: "chat-compose",
        title: "Compose",
        body: "Start an email draft quickly. Use this when you want help writing or replying to mail.",
    },
    {
        id: "chat-send",
        title: "Send",
        body: "Send your message when you are ready. The assistant will respond or prepare the next step.",
    },
    {
        id: "chat-history",
        title: "History",
        body: "Browse past conversations and jump back into any chat session you opened before.",
    },
    {
        id: "chat-new",
        title: "New chat",
        body: "Start a fresh conversation without losing your previous sessions in history.",
    },
    {
        id: "sidebar-inbox",
        title: "Inbox",
        body: "Open your inbox to read threads, search mail, and manage messages in the mailbox view.",
    },
    {
        id: "sidebar-starred",
        title: "Starred",
        body: "See messages you marked as important so you can find them again quickly.",
    },
    {
        id: "sidebar-draft",
        title: "Drafts",
        body: "Continue email drafts you saved and finish them when you are ready to send.",
    },
    {
        id: "sidebar-sent",
        title: "Sent",
        body: "Review messages you already sent and follow up when you need more context.",
    },
    {
        id: "sidebar-spam",
        title: "Spam",
        body: "Check messages filtered as spam and recover anything that landed there by mistake.",
    },
    {
        id: "sidebar-trash",
        title: "Trash",
        body: "Find deleted mail, restore what you still need, or remove it for good.",
    },
    {
        id: "sidebar-calendar",
        title: "Calendar",
        body: "Open your calendar to view events, check availability, and manage your schedule.",
    },
    {
        id: "sidebar-chat",
        title: "Workspace chat",
        body: "Return here anytime to talk with your assistant and run mail or calendar tasks.",
    },
    {
        id: "sidebar-settings",
        title: "Workspace settings",
        body: "Connect Gmail and Google Calendar, then manage integrations for your account.",
    },
    {
        id: "sidebar-theme",
        title: "Theme",
        body: "Switch between light and dark mode to match how you like to work.",
    },
    {
        id: "nav-mail",
        title: "Mail",
        body: "Jump to the full mail workspace when you want a dedicated inbox experience.",
    },
    {
        id: "nav-calendar",
        title: "Calendar",
        body: "Jump to the calendar workspace to browse and manage events in detail.",
    },
    {
        id: "nav-chat",
        title: "Chat",
        body: "Return to chat from anywhere in the app to talk with your AI agent.",
    },
    {
        id: "nav-settings",
        title: "Settings",
        body: "Manage account connections and integration settings from the top navigation.",
    },
    {
        id: "nav-theme",
        title: "Theme",
        body: "Toggle light or dark mode from the top bar whenever you want a different look.",
    },
];

type ChatCoachmarkTourProps = {
    ready?: boolean;
};

export function ChatCoachmarkTour({ ready = true }: ChatCoachmarkTourProps) {
    return (
        <CoachmarkTour
            steps={CHAT_COACHMARK_STEPS}
            storageKey={CHAT_COACHMARKS_STORAGE_KEY}
            ready={ready}
        />
    );
}
