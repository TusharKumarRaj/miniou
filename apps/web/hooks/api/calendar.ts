"use client";

import { trpc } from "~/trpc/client";

type CalendarEventsQuery = {
    maxResults?: number;
    timeMin?: string;
    timeMax?: string;
    daysAhead?: number;
};

export function useCalendarEvents(query: CalendarEventsQuery = {}) {
    return trpc.calendar.listEvents.useQuery({
        maxResults: query.maxResults ?? 50,
        timeMin: query.timeMin,
        timeMax: query.timeMax,
        daysAhead: query.daysAhead,
    });
}

export function useCalendarEvent(eventId: string | null) {
    return trpc.calendar.getEvent.useQuery(
        { eventId: eventId ?? "" },
        { enabled: Boolean(eventId) },
    );
}

export function useCreateCalendarEvent() {
    const utils = trpc.useUtils();

    return trpc.calendar.createEvent.useMutation({
        onSuccess: () => {
            void utils.calendar.listEvents.invalidate();
        },
    });
}

export function useDeleteCalendarEvent() {
    const utils = trpc.useUtils();

    return trpc.calendar.deleteEvent.useMutation({
        onSuccess: () => {
            void utils.calendar.listEvents.invalidate();
        },
    });
}
