"use client";

import type { GmailMailboxLabel } from "~/components/mail/sidebar";
import { trpc } from "~/trpc/client";

const PAGE_SIZE = 25;

export function useGmailMessages(label: GmailMailboxLabel, maxResults = PAGE_SIZE) {
    return trpc.gmail.listInbox.useInfiniteQuery(
        { label, maxResults },
        {
            getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
        },
    );
}

/** @deprecated Use useGmailMessages */
export function useGmailInbox(maxResults = PAGE_SIZE) {
    return useGmailMessages("INBOX", maxResults);
}

export function useGmailMessage(messageId: string | null) {
    return trpc.gmail.getMessage.useQuery(
        { messageId: messageId ?? "" },
        { enabled: Boolean(messageId) },
    );
}

export function useGmailThread(threadId: string | null) {
    return trpc.gmail.getThread.useQuery(
        { threadId: threadId ?? "" },
        { enabled: Boolean(threadId) },
    );
}

export function useSendGmailEmail() {
    const utils = trpc.useUtils();

    return trpc.gmail.sendEmail.useMutation({
        onSuccess: () => {
            void utils.gmail.listInbox.invalidate();
            void utils.gmail.getThread.invalidate();
        },
    });
}
