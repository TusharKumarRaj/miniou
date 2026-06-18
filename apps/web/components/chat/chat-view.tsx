"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "~/components/layout/app-shell";
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
            <AppShell background="gmail">
                <MiniouLoading message="Loading chat..." />
            </AppShell>
        );
    }

    if (!sessionId) {
        return (
            <AppShell background="gmail">
                <MiniouLoading message="Starting chat..." />
            </AppShell>
        );
    }

    return (
        <AppShell
            background="gmail"
            contentClassName="mx-auto flex h-[calc(100dvh-0.5rem)] w-full max-w-6xl flex-col !pb-0 !pt-12 sm:!pt-14 md:!pt-[3.5rem]"
        >
            <div className="mb-1.5 flex shrink-0 items-center justify-end gap-2">
                <Link href="/mail">
                    <MiniouButton type="button" variant="secondary" size="sm">
                        Back to mail
                    </MiniouButton>
                </Link>
                <MiniouButton type="button" size="sm" onClick={handleNewChat}>
                    New chat
                </MiniouButton>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
                <MiniouPanel className="flex min-h-0 flex-col overflow-hidden">
                    <div className="border-b border-white/10 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                            History
                        </p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        {(sessionsData?.sessions ?? []).map((session) => {
                            const active = session.id === sessionId;
                            return (
                                <Link
                                    key={session.id}
                                    href={`/chat/${session.id}`}
                                    className={cn(
                                        "mb-1 block rounded-lg px-3 py-2.5 transition",
                                        active
                                            ? "miniou-nav-item-active"
                                            : "text-white/60 hover:bg-white/5 hover:text-white",
                                    )}
                                >
                                    <p className="truncate text-sm font-medium">{session.title}</p>
                                    <p className="mt-0.5 text-[10px] text-white/35">
                                        {formatSessionDate(session.updatedAt)}
                                    </p>
                                </Link>
                            );
                        })}
                        {(sessionsData?.sessions.length ?? 0) === 0 && (
                            <p className="px-2 py-4 text-sm text-white/45">No chats yet</p>
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
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                {history?.messages.length === 0 && (
                                    <p className="text-sm text-white/50">
                                        Try: &quot;Email John about the project update&quot; or
                                        &quot;Schedule a meeting tomorrow at 2pm&quot;
                                    </p>
                                )}
                                {history?.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={
                                            msg.role === "user"
                                                ? "miniou-chat-bubble-user"
                                                : "miniou-chat-bubble-assistant"
                                        }
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                                {sendMessage.isPending && (
                                    <p className="text-sm text-white/50">Thinking...</p>
                                )}
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="flex shrink-0 gap-2 border-t border-white/10 px-4 pb-5 pt-4"
                            >
                                <MiniouInput
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Send an email or schedule a meeting…"
                                    className="flex-1 rounded-xl py-3"
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
                                <p className="px-4 pb-4 text-sm text-miniou-red">
                                    {sendMessage.error.message}
                                </p>
                            )}
                        </>
                    )}
                </MiniouPanel>
            </div>
        </AppShell>
    );
}
