"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { EmailBody } from "~/components/mail/email-body";
import {
    extractEmailAddress,
    formatForwardedMessage,
    formatQuotedReply,
    forwardSubject,
    replySubject,
} from "~/components/mail/mail-utils";
import { ThreadActions } from "~/components/mail/thread-actions";
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
import { useGmailMessages, useGmailThread, useSendGmailEmail } from "~/hooks/api/gmail";

const PAGE_SIZE = 25;

type ComposeKind = "new" | "reply" | "forward";

type ReplyContext = {
    threadId: string;
    inReplyTo?: string;
    references?: string;
};

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
                <WorkspaceShell activeWorkspace="mail">
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

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [composeKind, setComposeKind] = useState<ComposeKind | null>(null);
    const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const { data: selectedThread, isLoading: threadLoading } = useGmailThread(selectedThreadId);
    const latestThreadMessage = selectedThread?.messages.at(-1);

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
        setSelectedThreadId(null);
        resetCompose();
    }, [activeLabel]);

    function resetCompose() {
        setComposeKind(null);
        setReplyContext(null);
        setTo("");
        setSubject("");
        setBody("");
    }

    function openNewCompose() {
        resetCompose();
        setComposeKind("new");
        setSelectedThreadId(null);
    }

    function startReply() {
        if (!selectedThread || !latestThreadMessage) return;

        setComposeKind("reply");
        setReplyContext({
            threadId: selectedThread.threadId,
            inReplyTo: latestThreadMessage.internetMessageId,
            references: latestThreadMessage.internetMessageId,
        });
        setTo(extractEmailAddress(latestThreadMessage.from));
        setSubject(replySubject(selectedThread.subject));
        setBody("");
    }

    function startForward() {
        if (!selectedThread || !latestThreadMessage) return;

        setComposeKind("forward");
        setReplyContext(null);
        setTo("");
        setSubject(forwardSubject(selectedThread.subject));
        setBody(formatForwardedMessage(latestThreadMessage).trim());
    }

    function insertEmoji(emoji: string) {
        if (!selectedThread || !latestThreadMessage) return;

        if (composeKind !== "reply") {
            setComposeKind("reply");
            setReplyContext({
                threadId: selectedThread.threadId,
                inReplyTo: latestThreadMessage.internetMessageId,
                references: latestThreadMessage.internetMessageId,
            });
            setTo(extractEmailAddress(latestThreadMessage.from));
            setSubject(replySubject(selectedThread.subject));
            setBody(`${emoji} `);
            return;
        }

        setBody((current) => `${current}${emoji}`);
    }

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

    async function submitSend() {
        if (!to.trim()) return;

        let outboundBody = body;
        if (composeKind === "reply" && selectedThread?.messages.length) {
            const quoteTarget = selectedThread.messages.at(-1);
            if (quoteTarget) {
                outboundBody = `${body.trim()}\n${formatQuotedReply(quoteTarget)}`;
            }
        }

        await sendEmail.mutateAsync({
            to: to.trim(),
            subject,
            body: outboundBody,
            threadId: replyContext?.threadId,
            inReplyTo: replyContext?.inReplyTo,
            references: replyContext?.references,
        });

        const threadId = selectedThreadId;
        resetCompose();
        await refetchMailbox();
        if (threadId) {
            setSelectedThreadId(threadId);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        await submitSend();
    }

    function renderComposeForm(title: string) {
        return (
            <form onSubmit={handleSend} className="flex min-h-0 flex-1 flex-col p-4">
                <h2 className="shrink-0 text-lg font-medium">{title}</h2>
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
                <div className="mt-4 flex shrink-0 gap-2 border-t border-border pt-4">
                    <MiniouButton type="submit" disabled={sendEmail.isPending} size="sm">
                        {sendEmail.isPending ? "Sending..." : "Send"}
                    </MiniouButton>
                    <MiniouButton type="button" variant="secondary" size="sm" onClick={resetCompose}>
                        Cancel
                    </MiniouButton>
                </div>
                {sendEmail.error && (
                    <p className="mt-3 shrink-0 text-sm text-destructive">{sendEmail.error.message}</p>
                )}
            </form>
        );
    }

    const folderName = mailboxLabelName(activeLabel);
    const listPending = mailboxLoading && messages.length === 0;

    if (userLoading || statusLoading) {
        return (
            <WorkspaceShell activeWorkspace="mail" activeMailboxLabel={activeLabel}>
                <MiniouLoading message="Loading mailbox..." />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            activeWorkspace="mail"
            activeMailboxLabel={activeLabel}
            onSelectMailbox={setActiveLabel}
        >
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 lg:grid-cols-[300px_1fr]">
                <MiniouPanel className="flex h-full min-h-0 flex-col overflow-hidden max-lg:min-h-[40vh]">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                        <p className="text-sm font-medium text-muted">Gmail</p>
                            <span className="text-sm font-medium text-foreground">{folderName}</span>
                        </div>
                        <MiniouButton
                            type="button"
                            size="sm"
                            className="shrink-0 lg:hidden"
                            onClick={openNewCompose}
                        >
                            Compose
                        </MiniouButton>
                    </div>

                    <div ref={listScrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
                        {listPending ? (
                            <div className="flex h-full min-h-[12rem] items-center justify-center">
                                <p className="text-sm text-muted">Loading emails...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {messages.length === 0 && (
                                    <p className="px-4 py-6 text-sm text-muted">
                                        No messages in {folderName.toLowerCase()}.
                                    </p>
                                )}
                                {messages.map((message) => (
                                    <button
                                        key={message.threadId || message.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedThreadId(message.threadId || message.id);
                                            resetCompose();
                                        }}
                                        className={`w-full px-4 py-3 text-left transition hover:bg-muted-surface ${
                                            selectedThreadId === (message.threadId || message.id)
                                                ? "bg-accent-soft"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`truncate text-sm ${
                                                    message.isUnread
                                                        ? "font-semibold text-foreground"
                                                        : "text-foreground/80"
                                                }`}
                                            >
                                                {messageListTitle(activeLabel, message)}
                                                {(message.messageCount ?? 1) > 1 && (
                                                    <span className="ml-1 text-xs font-normal text-muted">
                                                        ({message.messageCount})
                                                    </span>
                                                )}
                                            </p>
                                            <span className="shrink-0 text-xs text-muted">
                                                {formatDate(message.date)}
                                            </span>
                                        </div>
                                        <p
                                            className={`truncate text-sm ${
                                                message.isUnread
                                                    ? "text-foreground/90"
                                                    : "text-foreground/60"
                                            }`}
                                        >
                                            {message.subject}
                                        </p>
                                        <p className="truncate text-xs text-muted">
                                            {message.snippet}
                                        </p>
                                    </button>
                                ))}

                                <div ref={loadMoreRef} className="px-4 py-3">
                                    {isFetchingNextPage && (
                                        <p className="text-center text-xs text-muted">
                                            Loading more...
                                        </p>
                                    )}
                                    {!hasNextPage && messages.length > 0 && (
                                        <p className="text-center text-xs text-muted">
                                            End of {folderName.toLowerCase()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </MiniouPanel>

                <MiniouPanel className="flex h-full min-h-0 flex-col overflow-hidden max-lg:min-h-[50vh]">
                    <div className="hidden shrink-0 items-center justify-end border-b border-border px-4 py-3 lg:flex">
                        <MiniouButton
                            type="button"
                            size="sm"
                            onClick={openNewCompose}
                        >
                            Compose
                        </MiniouButton>
                    </div>

                    {composeKind === "new" || composeKind === "forward" ? (
                        renderComposeForm(
                            composeKind === "forward" ? "Forward message" : "New message",
                        )
                    ) : selectedThreadId ? (
                        threadLoading ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center text-muted">
                                Loading conversation...
                            </div>
                        ) : selectedThread && selectedThread.messages.length > 0 ? (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                                    <h2 className="text-[1.35rem] font-semibold leading-tight">
                                        {selectedThread.subject}
                                    </h2>
                                    {selectedThread.messages.length > 1 && (
                                        <p className="mt-1 text-xs text-muted">
                                            {selectedThread.messages.length} messages
                                        </p>
                                    )}

                                    <div className="mt-5 space-y-10">
                                        {selectedThread.messages.map((message, index) => (
                                            <article
                                                key={message.id}
                                                className={
                                                    index > 0 ? "border-t border-border pt-10" : undefined
                                                }
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">
                                                            {messageListTitle(activeLabel, message)}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-xs text-muted">
                                                            to {extractEmailAddress(message.to) || "me"}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-xs text-muted">
                                                        {formatDate(message.date)}
                                                    </p>
                                                </div>
                                                <EmailBody
                                                    bodyHtml={message.bodyHtml}
                                                    bodyText={message.bodyText ?? message.body}
                                                    fallback={message.snippet}
                                                />
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                <div className="shrink-0 border-t border-border px-6 py-4">
                                    {composeKind === "reply" ? (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Reply</p>
                                            <MiniouInput
                                                type="email"
                                                value={to}
                                                onChange={(e) => setTo(e.target.value)}
                                                placeholder="To"
                                                required
                                            />
                                            <MiniouTextarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                placeholder="Write your reply..."
                                                className="min-h-[120px]"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                <MiniouButton
                                                    type="button"
                                                    size="sm"
                                                    disabled={sendEmail.isPending || !to.trim()}
                                                    onClick={() => void submitSend()}
                                                >
                                                    {sendEmail.isPending ? "Sending..." : "Send"}
                                                </MiniouButton>
                                                <MiniouButton
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={resetCompose}
                                                >
                                                    Cancel
                                                </MiniouButton>
                                            </div>
                                            {sendEmail.error && (
                                                <p className="text-sm text-destructive">
                                                    {sendEmail.error.message}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <ThreadActions
                                            onReply={startReply}
                                            onForward={startForward}
                                            onInsertEmoji={insertEmoji}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 items-center justify-center text-muted">
                                Conversation not found.
                            </div>
                        )
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center text-muted">
                            <p className="text-sm">Select a conversation to read</p>
                            <p className="mt-2 text-xs">or click Compose to write a new email</p>
                        </div>
                    )}
                </MiniouPanel>
            </div>
        </WorkspaceShell>
    );
}
