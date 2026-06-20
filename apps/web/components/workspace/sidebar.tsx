"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "~/lib/cn";

export type GmailMailboxLabel =
    | "INBOX"
    | "STARRED"
    | "DRAFT"
    | "SENT"
    | "SPAM"
    | "TRASH";

export type WorkspaceSection = "mail" | "chat" | "calendar" | "settings";

export const GMAIL_MAILBOXES: {
    label: GmailMailboxLabel;
    name: string;
    icon: ReactNode;
}[] = [
    {
        label: "INBOX",
        name: "Inbox",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 6h16v12H4z" />
                <path d="M4 7l8 6 8-6" />
            </svg>
        ),
    },
    {
        label: "STARRED",
        name: "Starred",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 3l2.4 5.8L21 10l-4.5 4.2L17.5 21 12 17.8 6.5 21l1-6.8L3 10l6.6-1.2L12 3z" />
            </svg>
        ),
    },
    {
        label: "DRAFT",
        name: "Drafts",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
                <path d="M14 3v6h6" />
            </svg>
        ),
    },
    {
        label: "SENT",
        name: "Sent",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
        ),
    },
    {
        label: "SPAM",
        name: "Spam",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
            </svg>
        ),
    },
    {
        label: "TRASH",
        name: "Trash",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
        ),
    },
];

function navItemClass(active: boolean) {
    return cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition",
        active
            ? "miniou-nav-item-active"
            : "text-muted hover:bg-surface-hover hover:text-foreground",
    );
}

export function mailboxLabelName(label: GmailMailboxLabel): string {
    return GMAIL_MAILBOXES.find((m) => m.label === label)?.name ?? label;
}

export function isGmailMailboxLabel(value: string): value is GmailMailboxLabel {
    return GMAIL_MAILBOXES.some((m) => m.label === value);
}

type WorkspaceSidebarProps = {
    activeWorkspace: WorkspaceSection;
    activeMailboxLabel?: GmailMailboxLabel;
    onSelectMailbox?: (label: GmailMailboxLabel) => void;
};

export function WorkspaceSidebar({
    activeWorkspace,
    activeMailboxLabel = "INBOX",
    onSelectMailbox,
}: WorkspaceSidebarProps) {
    const pathname = usePathname();
    const onMailPage = pathname.startsWith("/mail");

    return (
        <aside className="miniou-panel hidden w-56 shrink-0 flex-col p-3 lg:flex">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Mailboxes
            </p>
            <nav className="space-y-0.5">
                {GMAIL_MAILBOXES.map((mailbox) => {
                    const active = activeWorkspace === "mail" && mailbox.label === activeMailboxLabel;

                    if (onMailPage && onSelectMailbox) {
                        return (
                            <button
                                key={mailbox.label}
                                type="button"
                                onClick={() => onSelectMailbox(mailbox.label)}
                                className={navItemClass(active)}
                            >
                                {mailbox.icon}
                                {mailbox.name}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={mailbox.label}
                            href={`/mail?folder=${mailbox.label}`}
                            className={navItemClass(active)}
                        >
                            {mailbox.icon}
                            {mailbox.name}
                        </Link>
                    );
                })}
                <Link href="/calendar" className={navItemClass(activeWorkspace === "calendar")}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Calendar
                </Link>
            </nav>

            <div className="my-3 border-t border-border" />

            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Workspace
            </p>
            <nav className="space-y-0.5">
                <Link href="/chat" className={navItemClass(activeWorkspace === "chat")}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                    </svg>
                    Chat
                </Link>
                <Link
                    href="/settings/integrations"
                    className={navItemClass(activeWorkspace === "settings")}
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    Settings
                </Link>
            </nav>
        </aside>
    );
}

export { WorkspaceSidebar as MailSidebar };
