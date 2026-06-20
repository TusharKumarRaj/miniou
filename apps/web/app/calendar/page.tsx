"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
    CompactMonthCalendar,
    eventsForDay,
    formatDayHeading,
} from "~/components/calendar/compact-month-grid";
import { formatEventTime, getMonthGridRange, toDateKey } from "~/components/calendar/month-grid";
import { WorkspaceShell } from "~/components/workspace/shell";
import { MiniouModal } from "~/components/ui/modal";
import {
    MiniouButton,
    MiniouInput,
    MiniouLabel,
    MiniouLink,
    MiniouLoading,
    MiniouPanel,
    MiniouTextarea,
} from "~/components/ui/miniou";
import { useRequireAuth } from "~/hooks/api/auth";
import { useIntegrationStatus } from "~/hooks/api/integration";
import { useWebhookSync } from "~/hooks/api/sync";
import {
    useCalendarEvent,
    useCalendarEvents,
    useCreateCalendarEvent,
    useDeleteCalendarEvent,
} from "~/hooks/api/calendar";

function formatEventRange(start: string, end: string) {
    if (!start) return "";

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (Number.isNaN(startDate.getTime())) return start;

    const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
    };
    const timeOpts: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
    };

    const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(start);

    if (isAllDay) {
        return startDate.toLocaleDateString(undefined, dateOpts);
    }

    const startLabel = `${startDate.toLocaleDateString(undefined, dateOpts)} · ${startDate.toLocaleTimeString(undefined, timeOpts)}`;

    if (!endDate || Number.isNaN(endDate.getTime())) return startLabel;

    const sameDay = startDate.toDateString() === endDate.toDateString();
    const endLabel = sameDay
        ? endDate.toLocaleTimeString(undefined, timeOpts)
        : `${endDate.toLocaleDateString(undefined, dateOpts)} · ${endDate.toLocaleTimeString(undefined, timeOpts)}`;

    return `${startLabel} – ${endLabel}`;
}

function toLocalInput(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultCreateTimes(forDate?: Date) {
    const start = forDate ? new Date(forDate) : new Date();
    if (!forDate) {
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() + 1);
    } else {
        start.setHours(9, 0, 0, 0);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    return { start: toLocalInput(start), end: toLocalInput(end) };
}

type ModalMode = "create" | "view" | null;

export default function CalendarPage() {
    const router = useRouter();
    const { isLoading: userLoading } = useRequireAuth();
    const { data: status, isLoading: statusLoading } = useIntegrationStatus();
    useWebhookSync("googlecalendar");

    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState(() => new Date());
    const selectedDayKey = toDateKey(selectedDay);
    const range = useMemo(() => getMonthGridRange(viewDate), [viewDate]);

    const {
        data: eventsData,
        isLoading: eventsLoading,
        refetch,
    } = useCalendarEvents({
        timeMin: range.gridStart.toISOString(),
        timeMax: range.gridEnd.toISOString(),
        maxResults: 100,
    });

    const createEvent = useCreateCalendarEvent();
    const deleteEvent = useDeleteCalendarEvent();

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const defaults = defaultCreateTimes(selectedDay);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [start, setStart] = useState(defaults.start);
    const [end, setEnd] = useState(defaults.end);
    const [attendees, setAttendees] = useState("");

    const { data: selectedEvent, isLoading: eventLoading } = useCalendarEvent(selectedId);

    useEffect(() => {
        if (!statusLoading && status && !status.googlecalendar) {
            router.push("/settings/integrations");
        }
    }, [status, statusLoading, router]);

    const events = eventsData?.events ?? [];
    const dayEvents = useMemo(
        () => eventsForDay(events, selectedDayKey),
        [events, selectedDayKey],
    );

    function openCreate(forDate?: Date) {
        const date = forDate ?? selectedDay;
        const times = defaultCreateTimes(date);
        setStart(times.start);
        setEnd(times.end);
        setTitle("");
        setDescription("");
        setLocation("");
        setAttendees("");
        setSelectedId(null);
        setModalMode("create");
    }

    function openView(eventId: string) {
        setSelectedId(eventId);
        setModalMode("view");
    }

    function closeModal() {
        setModalMode(null);
        setSelectedId(null);
    }

    function handleSelectDay(date: Date) {
        setSelectedDay(date);
        setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const attendeeEmails = attendees
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean);

        await createEvent.mutateAsync({
            title: title.trim(),
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            timeZone,
            attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
        });

        closeModal();
        await refetch();
    }

    async function handleDelete() {
        if (!selectedId) return;
        await deleteEvent.mutateAsync({ eventId: selectedId });
        closeModal();
        await refetch();
    }

    if (userLoading || statusLoading || eventsLoading) {
        return (
            <WorkspaceShell activeWorkspace="calendar">
                <MiniouLoading message="Loading calendar..." />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell activeWorkspace="calendar">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted">Schedule</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="mt-1 text-sm text-muted">
                        {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"} on selected day
                    </p>
                </div>
                <MiniouButton type="button" size="sm" onClick={() => openCreate()}>
                    Add event
                </MiniouButton>
            </div>

            <div className="grid min-h-0 flex-1 grid-rows-1 gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
                <MiniouPanel className="h-full p-4">
                    <CompactMonthCalendar
                        viewDate={viewDate}
                        events={events}
                        selectedDayKey={selectedDayKey}
                        onSelectDay={handleSelectDay}
                        onPrevMonth={() =>
                            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                        }
                        onNextMonth={() =>
                            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                        }
                        onToday={() => {
                            const today = new Date();
                            setViewDate(today);
                            setSelectedDay(today);
                        }}
                    />
                </MiniouPanel>

                <MiniouPanel className="flex h-full min-h-0 flex-col overflow-hidden">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-lg font-semibold">{formatDayHeading(selectedDay)}</h2>
                        <p className="mt-1 text-sm text-foreground/50">
                            {dayEvents.length === 0
                                ? "No events scheduled"
                                : `${dayEvents.length} scheduled`}
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {dayEvents.length === 0 ? (
                            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-center text-foreground/50">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="mb-3 h-10 w-10 text-foreground/25"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                <p className="text-sm">No events scheduled</p>
                                <p className="mt-1 text-xs">Click Add event to create one</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {dayEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => openView(event.id)}
                                        className="miniou-glass-subtle w-full rounded-lg px-4 py-3 text-left transition hover:bg-muted-surface"
                                    >
                                        <p className="text-sm font-medium text-foreground">
                                            {event.title}
                                        </p>
                                        <p className="mt-1 text-xs text-foreground/50">
                                            {formatEventTime(event.start)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </MiniouPanel>
            </div>

            <MiniouModal
                open={modalMode === "create"}
                onClose={closeModal}
                title="New event"
            >
                <form onSubmit={handleCreate} className="space-y-3">
                    <MiniouInput
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        required
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                            <MiniouLabel>Start</MiniouLabel>
                            <MiniouInput
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                required
                            />
                        </label>
                        <label className="block text-sm">
                            <MiniouLabel>End</MiniouLabel>
                            <MiniouInput
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                required
                            />
                        </label>
                    </div>
                    <MiniouInput
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                    />
                    <MiniouInput
                        type="text"
                        value={attendees}
                        onChange={(e) => setAttendees(e.target.value)}
                        placeholder="Attendees (comma-separated emails)"
                    />
                    <MiniouTextarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        className="min-h-[100px]"
                    />
                    <div className="flex gap-2 pt-2">
                        <MiniouButton type="submit" disabled={createEvent.isPending} size="sm">
                            {createEvent.isPending ? "Creating..." : "Create"}
                        </MiniouButton>
                        <MiniouButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={closeModal}
                        >
                            Cancel
                        </MiniouButton>
                    </div>
                    {createEvent.error && (
                        <p className="text-sm text-destructive">{createEvent.error.message}</p>
                    )}
                </form>
            </MiniouModal>

            <MiniouModal
                open={modalMode === "view"}
                onClose={closeModal}
                title={selectedEvent?.title ?? "Event"}
            >
                {eventLoading ? (
                    <p className="text-sm text-foreground/50">Loading event...</p>
                ) : selectedEvent ? (
                    <div className="space-y-4">
                        <p className="text-sm text-foreground/50">
                            {formatEventRange(selectedEvent.start, selectedEvent.end)}
                        </p>
                        {selectedEvent.location && (
                            <p className="text-sm text-foreground/70">{selectedEvent.location}</p>
                        )}
                        {selectedEvent.description && (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                                {selectedEvent.description}
                            </p>
                        )}
                        {selectedEvent.attendees.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                                    Attendees
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-foreground/70">
                                    {selectedEvent.attendees.map((attendee) => (
                                        <li key={attendee.email}>
                                            {attendee.displayName || attendee.email}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {selectedEvent.htmlLink && (
                                <MiniouLink
                                    href={selectedEvent.htmlLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in Google Calendar
                                </MiniouLink>
                            )}
                            {selectedEvent.hangoutLink && (
                                <MiniouLink
                                    href={selectedEvent.hangoutLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Join meeting
                                </MiniouLink>
                            )}
                        </div>
                        <div className="flex gap-2 border-t border-border pt-4">
                            <MiniouButton
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleteEvent.isPending}
                            >
                                {deleteEvent.isPending ? "Deleting..." : "Delete"}
                            </MiniouButton>
                            <MiniouButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={closeModal}
                            >
                                Close
                            </MiniouButton>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-foreground/50">Event not found.</p>
                )}
            </MiniouModal>
        </WorkspaceShell>
    );
}
