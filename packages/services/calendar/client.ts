export type TenantCorsair = ReturnType<typeof import("@repo/corsair").withUserTenant>;

type EventDateTime = {
    date?: string;
    dateTime?: string;
    timeZone?: string;
};

type CalendarEvent = {
    id?: string;
    status?: string;
    htmlLink?: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: EventDateTime;
    end?: EventDateTime;
    attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
    hangoutLink?: string;
};

type EventListResponse = {
    items?: CalendarEvent[];
    nextPageToken?: string;
};

export type GoogleCalendarCorsairClient = {
    googlecalendar: {
        api: {
            events: {
                getMany: (input: {
                    calendarId?: string;
                    timeMin?: string;
                    timeMax?: string;
                    singleEvents?: boolean;
                    orderBy?: "startTime" | "updated";
                    maxResults?: number;
                    pageToken?: string;
                }) => Promise<EventListResponse>;
                get: (input: { id: string; calendarId?: string }) => Promise<CalendarEvent>;
                create: (input: {
                    calendarId?: string;
                    event: {
                        summary?: string;
                        description?: string;
                        location?: string;
                        start?: EventDateTime;
                        end?: EventDateTime;
                        attendees?: Array<{ email: string }>;
                    };
                    sendUpdates?: "all" | "externalOnly" | "none";
                }) => Promise<CalendarEvent>;
                delete: (input: {
                    id: string;
                    calendarId?: string;
                    sendUpdates?: "all" | "externalOnly" | "none";
                }) => Promise<void>;
            };
        };
    };
};

export function asCalendarClient(tenant: TenantCorsair): GoogleCalendarCorsairClient {
    return tenant as GoogleCalendarCorsairClient;
}

function formatEventWhen(start?: EventDateTime, end?: EventDateTime): string {
    if (!start) return "";

    if (start.date && !start.dateTime) {
        return start.date;
    }

    const startMs = start.dateTime ? Date.parse(start.dateTime) : NaN;
    const endMs = end?.dateTime ? Date.parse(end.dateTime) : NaN;

    if (Number.isNaN(startMs)) return start.dateTime ?? "";

    const startLabel = new Date(startMs).toISOString();
    if (Number.isNaN(endMs)) return startLabel;

    return `${startLabel}/${new Date(endMs).toISOString()}`;
}

export function mapEventSummary(event: CalendarEvent) {
    return {
        id: event.id ?? "",
        title: event.summary ?? "(No title)",
        description: event.description ?? "",
        location: event.location ?? "",
        when: formatEventWhen(event.start, event.end),
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        htmlLink: event.htmlLink ?? "",
        hangoutLink: event.hangoutLink ?? "",
        status: event.status ?? "",
        attendeeCount: event.attendees?.length ?? 0,
    };
}

export function mapEventDetail(event: CalendarEvent) {
    return {
        ...mapEventSummary(event),
        attendees:
            event.attendees?.map((attendee) => ({
                email: attendee.email ?? "",
                displayName: attendee.displayName ?? "",
                responseStatus: attendee.responseStatus ?? "",
            })) ?? [],
    };
}

export async function fetchUpcomingEvents(
    tenant: TenantCorsair,
    options: {
        maxResults?: number;
        pageToken?: string;
        daysAhead?: number;
        timeMin?: string;
        timeMax?: string;
    },
) {
    const corsair = asCalendarClient(tenant);
    const now = new Date();
    const timeMin = options.timeMin ?? now.toISOString();
    const timeMax =
        options.timeMax ??
        (() => {
            const end = new Date(now);
            end.setDate(end.getDate() + (options.daysAhead ?? 30));
            return end.toISOString();
        })();

    const list = await corsair.googlecalendar.api.events.getMany({
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: options.maxResults ?? 25,
        pageToken: options.pageToken,
    });

    const events = (list.items ?? [])
        .filter((event) => event.status !== "cancelled")
        .map(mapEventSummary);

    return {
        events,
        nextPageToken: list.nextPageToken,
    };
}

export async function fetchCalendarEvent(tenant: TenantCorsair, eventId: string) {
    const corsair = asCalendarClient(tenant);
    const event = await corsair.googlecalendar.api.events.get({ id: eventId });
    return mapEventDetail(event);
}

export async function createCalendarEvent(
    tenant: TenantCorsair,
    input: {
        title: string;
        description?: string;
        location?: string;
        start: string;
        end: string;
        timeZone?: string;
        attendeeEmails?: string[];
    },
) {
    const corsair = asCalendarClient(tenant);
    const timeZone = input.timeZone ?? "UTC";
    const attendees = (input.attendeeEmails ?? [])
        .map((email) => email.trim())
        .filter(Boolean)
        .map((email) => ({ email }));

    const event = await corsair.googlecalendar.api.events.create({
        event: {
            summary: input.title,
            description: input.description,
            location: input.location,
            start: { dateTime: input.start, timeZone },
            end: { dateTime: input.end, timeZone },
            attendees: attendees.length > 0 ? attendees : undefined,
        },
        sendUpdates: attendees.length > 0 ? "all" : "none",
    });

    return mapEventDetail(event);
}

export async function deleteCalendarEvent(tenant: TenantCorsair, eventId: string) {
    const corsair = asCalendarClient(tenant);
    await corsair.googlecalendar.api.events.delete({
        id: eventId,
        sendUpdates: "all",
    });
}
