"use client";

import { use } from "react";

import { ChatView } from "~/components/chat/chat-view";

export default function ChatSessionPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const { sessionId } = use(params);
    return <ChatView sessionId={sessionId} />;
}
