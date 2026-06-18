"use client";

import { useEffect, useRef } from "react";

import { trpc } from "~/trpc/client";

type SyncChannel = "gmail" | "googlecalendar";

const POLL_MS = 5000;

export function useWebhookSync(channel: SyncChannel) {
    const utils = trpc.useUtils();
    const lastRevision = useRef<number | null>(null);
    const { data } = trpc.integration.getSyncRevision.useQuery(undefined, {
        refetchInterval: POLL_MS,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!data) return;

        const revision = data[channel];
        if (lastRevision.current !== null && revision > lastRevision.current) {
            if (channel === "gmail") {
                void utils.gmail.listInbox.invalidate();
            } else {
                void utils.calendar.listEvents.invalidate();
            }
        }

        lastRevision.current = revision;
    }, [channel, data, utils]);
}
