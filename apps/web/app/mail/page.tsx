"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import {
    isGmailMailboxLabel,
    mailboxLabelName,
    type GmailMailboxLabel,
} from "~/components/mail/sidebar";
import { WorkspaceShell } from "~/components/workspace/shell";
import {
    MiniouButton,
    MiniouInput,
    MiniouLoading,
    MiniouPanel,
    MiniouTextarea,
} from "~/components/ui/miniou";
import { useRequireAuth } from "~/hooks/api/auth";
import { useIntegrationStatus } from "~/hooks/api/integration";
import { useWebhookSync } from "~/hooks/api/sync";
import { useGmailMessage, useGmailMessages, useSendGmailEmail } from "~/hooks/api/gmail";

const PAGE_SIZE = 25;

function formatDate(iso: string) {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function extractEmailName(value: string) {
    const match = value.match(/^([^<]+)</);
    if (match?.[1]) return match[1].trim().replace(/"/g, "");
    return value;
}

function messageListTitle(label: GmailMailboxLabel, message: { from: string; to: string }) {
    if (label === "SENT" || label === "DRAFT") {
        const to = message.to.trim();
        if (to) return extractEmailName(to) || to;
    }
    const from = message.from.trim();
    return extractEmailName(from) || from || "Unknown sender";
}

export default function MailPage() {
    return (
        <Suspense
            fallback={
                <WorkspaceShell background="gmail" activeWorkspace="mail">
                    <MiniouLoading message="Loading mailbox..." />
                </WorkspaceShell>
            }
        >
            <MailPageContent />
        </Suspense>
    );
}

function MailPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading: userLoading } = useRequireAuth();
    const { data: status, isLoading: statusLoading } = useIntegrationStatus();
    useWebhookSync("gmail");
    const sendEmail = useSendGmailEmail();

    const folderParam = searchParams.get("folder");
    const [activeLabel, setActiveLabel] = useState<GmailMailboxLabel>(() =>
        folderParam && isGmailMailboxLabel(folderParam) ? folderParam : "INBOX",
    );
    const listScrollRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data: mailbox,
        isLoading: mailboxLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch: refetchMailbox,
    } = useGmailMessages(activeLabel, PAGE_SIZE);

    const messages = useMemo(
        () => mailbox?.pages.flatMap((page) => page.messages) ?? [],
        [mailbox?.pages],
    );

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [composing, setComposing] = useState(false);
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const { data: selectedMessage, isLoading: messageLoading } = useGmailMessage(selectedId);

    useEffect(() => {
        if (!statusLoading && status && !status.gmail) {
            router.push("/settings/integrations");
        }
    }, [status, statusLoading, router]);

    useEffect(() => {
        const folder = searchParams.get("folder");
        if (folder && isGmailMailboxLabel(folder)) {
            setActiveLabel(folder);
        }
    }, [searchParams]);

    useEffect(() => {
        setSelectedId(null);
        setComposing(false);
    }, [activeLabel]);

    useEffect(() => {
        const root = listScrollRef.current;
        const target = loadMoreRef.current;
        if (!root || !target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { root, rootMargin: "120px" },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, messages.length, activeLabel]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!to.trim()) return;

        await sendEmail.mutateAsync({
            to: to.trim(),
            subject,
            body,
        });

        setComposing(false);
        setTo("");
        setSubject("");
        setBody("");
        setSelectedId(null);
        await refetchMailbox();
    }

    const folderName = mailboxLabelName(activeLabel);
    const listPending = mailboxLoading && messages.length === 0;

    if (userLoading || statusLoading) {
        return (
            <WorkspaceShell background="gmail" activeWorkspace="mail" activeMailboxLabel={activeLabel}>
                <MiniouLoading message="Loading mailbox..." />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            background="gmail"
            activeWorkspace="mail"
            activeMailboxLabel={activeLabel}
            onSelectMailbox={setActiveLabel}
        >
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 lg:grid-cols-[300px_1fr]">
                <MiniouPanel className="flex h-full min-h-0 flex-col overflow-hidden max-lg:min-h-[40vh]">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-miniou-red">
                                Gmail
                            </p>
                            <span className="text-sm font-medium text-white">{folderName}</span>
                        </div>
                        <MiniouButton
                            type="button"
                            size="sm"
                            className="shrink-0 lg:hidden"
                            onClick={() => {
                                setComposing(true);
                                setSelectedId(null);
                            }}
                        >
                            Compose
                        </MiniouButton>
                    </div>

                    <div ref={listScrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
                        {listPending ? (
                            <div className="flex h-full min-h-[12rem] items-center justify-center">
                                <p className="text-sm text-white/50">Loading emails...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {messages.length === 0 && (
                                    <p className="px-4 py-6 text-sm text-white/50">
                                        No messages in {folderName.toLowerCase()}.
                                    </p>
                                )}
                                {messages.map((message) => (
                                    <button
                                        key={message.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(message.id);
                                            setComposing(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left transition hover:bg-white/[0.06] ${
                                            selectedId === message.id
                                                ? "bg-miniou-red/15 backdrop-blur-sm"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`truncate text-sm ${
                                                    message.isUnread
                                                        ? "font-semibold text-white"
                                                        : "text-white/80"
                                                }`}
                                            >
                                                {messageListTitle(activeLabel, message)}
                                            </p>
                                            <span className="shrink-0 text-xs text-white/40">
                                                {formatDate(message.date)}
                                            </span>
                                        </div>
                                        <p
                                            className={`truncate text-sm ${
                                                message.isUnread
                                                    ? "text-white/90"
                                                    : "text-white/60"
                                            }`}
                                        >
                                            {message.subject}
                                        </p>
                                        <p className="truncate text-xs text-white/40">
                                            {message.snippet}
                                        </p>
                                    </button>
                                ))}

                                <div ref={loadMoreRef} className="px-4 py-3">
                                    {isFetchingNextPage && (
                                        <p className="text-center text-xs text-white/40">
                                            Loading more...
                                        </p>
                                    )}
                                    {!hasNextPage && messages.length > 0 && (
                                        <p className="text-center text-xs text-white/30">
                                            End of {folderName.toLowerCase()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </MiniouPanel>

                <MiniouPanel className="flex h-full min-h-0 flex-col overflow-hidden max-lg:min-h-[50vh]">
                    <div className="hidden shrink-0 items-center justify-end border-b border-white/10 px-4 py-3 lg:flex">
                        <MiniouButton
                            type="button"
                            size="sm"
                            onClick={() => {
                                setComposing(true);
                                setSelectedId(null);
                            }}
                        >
                            Compose
                        </MiniouButton>
                    </div>

                    {composing ? (
                        <form onSubmit={handleSend} className="flex min-h-0 flex-1 flex-col p-4">
                            <h2 className="shrink-0 text-lg font-medium">New message</h2>
                            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                                <MiniouInput
                                    type="email"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    placeholder="To"
                                    required
                                />
                                <MiniouInput
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Subject"
                                />
                                <MiniouTextarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Write your message..."
                                    className="min-h-[200px]"
                                />
                            </div>
                            <div className="mt-4 flex shrink-0 gap-2 border-t border-white/10 pt-4">
                                <MiniouButton type="submit" disabled={sendEmail.isPending} size="sm">
                                    {sendEmail.isPending ? "Sending..." : "Send"}
                                </MiniouButton>
                                <MiniouButton
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setComposing(false)}
                                >
                                    Cancel
                                </MiniouButton>
                            </div>
                            {sendEmail.error && (
                                <p className="mt-3 shrink-0 text-sm text-miniou-red">
                                    {sendEmail.error.message}
                                </p>
                            )}
                        </form>
                    ) : selectedId ? (
                        messageLoading ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center text-white/50">
                                Loading message...
                            </div>
                        ) : selectedMessage ? (
                            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                                <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                                <div className="mt-4 space-y-1 text-sm text-white/50">
                                    <p>
                                        <span className="text-white/35">From:</span>{" "}
                                        {selectedMessage.from}
                                    </p>
                                    <p>
                                        <span className="text-white/35">To:</span>{" "}
                                        {selectedMessage.to}
                                    </p>
                                    <p>
                                        <span className="text-white/35">Date:</span>{" "}
                                        {formatDate(selectedMessage.date)}
                                    </p>
                                </div>
                                <div className="mt-6 whitespace-pre-wrap text-sm leading-6 text-white/90">
                                    {selectedMessage.body || selectedMessage.snippet}
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 items-center justify-center text-white/50">
                                Message not found.
                            </div>
                        )
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center text-white/50">
                            <p className="text-sm">Select a message to read</p>
                            <p className="mt-2 text-xs">or click Compose to write a new email</p>
                        </div>
                    )}
                </MiniouPanel>
            </div>
        </WorkspaceShell>
    );
}
