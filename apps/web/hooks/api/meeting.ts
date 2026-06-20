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

export function usePrepareEmailDraft(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.prepareEmailDraft.useMutation({
        onSuccess: (_data, variables) => {
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
            void utils.meeting.listSessions.invalidate();
        },
    });
}

export function usePrepareCalendarDraft(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.prepareCalendarDraft.useMutation({
        onSuccess: (_data, variables) => {
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
            void utils.meeting.listSessions.invalidate();
        },
    });
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

export function useConfirmEmailSend(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.confirmEmailSend.useMutation({
        onSuccess: (_data, variables) => {
            utils.meeting.getHistory.setData({ sessionId: variables.sessionId, limit: 50 }, (current) =>
                current ? { ...current, pendingEmail: null } : current,
            );
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
        },
    });
}

export function useCancelEmailPreview(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.cancelEmailPreview.useMutation({
        onSuccess: (_data, variables) => {
            utils.meeting.getHistory.setData({ sessionId: variables.sessionId, limit: 50 }, (current) =>
                current ? { ...current, pendingEmail: null } : current,
            );
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
        },
    });
}

export function useConfirmCalendarEvent(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.confirmCalendarEvent.useMutation({
        onSuccess: (_data, variables) => {
            utils.meeting.getHistory.setData({ sessionId: variables.sessionId, limit: 50 }, (current) =>
                current ? { ...current, pendingCalendar: null } : current,
            );
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
        },
    });
}

export function useCancelCalendarPreview(sessionId: string | null) {
    const utils = trpc.useUtils();

    return trpc.meeting.cancelCalendarPreview.useMutation({
        onSuccess: (_data, variables) => {
            utils.meeting.getHistory.setData({ sessionId: variables.sessionId, limit: 50 }, (current) =>
                current ? { ...current, pendingCalendar: null } : current,
            );
            void utils.meeting.getHistory.invalidate({ sessionId: variables.sessionId });
        },
    });
}

// Legacy aliases
export const useMeetingHistory = useChatHistory;
export const useSendMessage = useSendChatMessage;
