"use client";

import { trpc } from "~/trpc/client";

export function useChatSessions(limit = 30) {
    return trpc.meeting.listSessions.useQuery({ limit });
}

export function useCreateChatSession() {
    const utils = trpc.useUtils();

    return trpc.meeting.createSession.useMutation({
        onSuccess: () => {
            void utils.meeting.listSessions.invalidate();
        },
    });
}

export function useChatHistory(sessionId: string | null, limit = 50) {
    return trpc.meeting.getHistory.useQuery(
        { sessionId: sessionId ?? "", limit },
        { enabled: Boolean(sessionId) },
    );
}

export function useSendChatMessage(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.sendMessage.useMutation({
        onSuccess: (_data, variables) => {
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
            void utils.meeting.listSessions.invalidate();
        },
    });
}

// Legacy aliases
export const useMeetingHistory = useChatHistory;
export const useSendMessage = useSendChatMessage;
