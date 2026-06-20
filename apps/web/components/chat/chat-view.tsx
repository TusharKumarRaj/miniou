"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { WorkspaceShell } from "~/components/workspace/shell";
import {
    MiniouButton,
    MiniouInput,
    MiniouLoading,
    MiniouPanel,
} from "~/components/ui/miniou";
import { useRequireAuth } from "~/hooks/api/auth";
import { useIntegrationStatus } from "~/hooks/api/integration";
import {
    useChatHistory,
    useChatSessions,
    useCreateChatSession,
    useSendChatMessage,
} from "~/hooks/api/meeting";
import { cn } from "~/lib/cn";

function formatSessionDate(iso: Date | string) {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatView({ sessionId }: { sessionId?: string }) {
    const router = useRouter();
    const { isLoading: userLoading } = useRequireAuth();
    const { data: status, isLoading: statusLoading } = useIntegrationStatus();
    const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
    const createSession = useCreateChatSession();
    const { data: history, isLoading: historyLoading } = useChatHistory(sessionId ?? null);
    const sendMessage = useSendChatMessage(sessionId ?? null);
    const [message, setMessage] = useState("");
    const [bootstrapping, setBootstrapping] = useState(!sessionId);

    useEffect(() => {
        if (!statusLoading && status && !status.gmail) {
            router.push("/settings/integrations");
        }
    }, [status, statusLoading, router]);

    useEffect(() => {
        if (sessionId || sessionsLoading || createSession.isPending) return;

        const sessions = sessionsData?.sessions ?? [];
        if (sessions.length > 0) {
            router.replace(`/chat/${sessions[0]!.id}`);
            return;
        }

        setBootstrapping(true);
        void createSession.mutateAsync({}).then((result) => {
            router.replace(`/chat/${result.session.id}`);
        });
    }, [sessionId, sessionsLoading, sessionsData, createSession, router]);

    async function handleNewChat() {
        const result = await createSession.mutateAsync({});
        router.push(`/chat/${result.session.id}`);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim() || !sessionId) return;

        const text = message.trim();
        setMessage("");
        await sendMessage.mutateAsync({ sessionId, message: text });
    }

    if (userLoading || statusLoading || sessionsLoading || (bootstrapping && !sessionId)) {
        return (
            <WorkspaceShell activeWorkspace="chat">
                <MiniouLoading message="Loading chat..." />
            </WorkspaceShell>
        );
    }

    if (!sessionId) {
        return (
            <WorkspaceShell activeWorkspace="chat">
                <MiniouLoading message="Starting chat..." />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell activeWorkspace="chat">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted">Assistant</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Chat</h1>
                </div>
                <MiniouButton type="button" size="sm" onClick={handleNewChat}>
                    New chat
                </MiniouButton>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">
                <MiniouPanel className="flex min-h-0 flex-col overflow-hidden max-lg:max-h-48">
                    <div className="border-b border-border px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                            History
                        </p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                        {(sessionsData?.sessions ?? []).map((session) => {
                            const active = session.id === sessionId;
                            return (
                                <Link
                                    key={session.id}
                                    href={`/chat/${session.id}`}
                                    className={cn(
                                        "mb-0.5 block rounded-md px-2.5 py-2 transition",
                                        active
                                            ? "miniou-nav-item-active"
                                            : "text-muted hover:bg-surface-hover hover:text-foreground",
                                    )}
                                >
                                    <p className="truncate text-[13px] font-medium">{session.title}</p>
                                    <p className="mt-0.5 text-[11px] text-muted">
                                        {formatSessionDate(session.updatedAt)}
                                    </p>
                                </Link>
                            );
                        })}
                        {(sessionsData?.sessions.length ?? 0) === 0 && (
                            <p className="px-2 py-4 text-[13px] text-muted">No chats yet</p>
                        )}
                    </div>
                </MiniouPanel>

                <MiniouPanel className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {historyLoading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <MiniouLoading message="Loading messages..." />
                        </div>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                                {history?.messages.length === 0 && (
                                    <div className="flex min-h-[12rem] flex-col items-center justify-center text-center">
                                        <p className="text-sm text-muted">
                                            Try: &quot;Email John about the project update&quot;
                                        </p>
                                        <p className="mt-1 text-[13px] text-muted">
                                            or &quot;Schedule a meeting tomorrow at 2pm&quot;
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-3">
                                    {history?.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex",
                                                msg.role === "user" ? "justify-end" : "justify-start",
                                            )}
                                        >
                                            <div
                                                className={
                                                    msg.role === "user"
                                                        ? "miniou-chat-bubble-user"
                                                        : "miniou-chat-bubble-assistant"
                                                }
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {sendMessage.isPending && (
                                        <div className="flex justify-start">
                                            <p className="miniou-chat-bubble-assistant text-muted">
                                                Thinking…
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="flex shrink-0 gap-2 border-t border-border bg-surface/30 p-3"
                            >
                                <MiniouInput
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Send an email or schedule a meeting…"
                                    className="flex-1"
                                    disabled={sendMessage.isPending}
                                />
                                <MiniouButton
                                    type="submit"
                                    disabled={sendMessage.isPending || !message.trim()}
                                >
                                    Send
                                </MiniouButton>
                            </form>

                            {sendMessage.error && (
                                <p className="px-3 pb-3 text-[13px] text-destructive">
                                    {sendMessage.error.message}
                                </p>
                            )}
                        </>
                    )}
                </MiniouPanel>
            </div>
        </WorkspaceShell>
    );
}
