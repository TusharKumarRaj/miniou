"use client";

import type { CalendarEventSummary } from "~/components/calendar/month-grid";
import {
    buildMonthGrid,
    eventDayKey,
    formatMonthYear,
    groupEventsByDay,
    toDateKey,
} from "~/components/calendar/month-grid";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type CompactMonthCalendarProps = {
    viewDate: Date;
    events: CalendarEventSummary[];
    selectedDayKey: string | null;
    onSelectDay: (date: Date) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
};

export function CompactMonthCalendar({
    viewDate,
    events,
    selectedDayKey,
    onSelectDay,
    onPrevMonth,
    onNextMonth,
    onToday,
}: CompactMonthCalendarProps) {
    const { cells, firstOfMonth, lastOfMonth } = buildMonthGrid(viewDate);
    const eventsByDay = groupEventsByDay(events);
    const todayKey = toDateKey(new Date());

    return (
        <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{formatMonthYear(viewDate)}</h2>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onToday}
                        className="miniou-btn-secondary px-2.5 py-1 text-xs"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        className="miniou-btn-secondary px-2.5 py-1 text-xs"
                        aria-label="Previous month"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="miniou-btn-secondary px-2.5 py-1 text-xs"
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 pb-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
                {WEEKDAYS.map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((date) => {
                    const key = toDateKey(date);
                    const inMonth = date >= firstOfMonth && date <= lastOfMonth;
                    const dayEvents = eventsByDay.get(key) ?? [];
                    const isToday = key === todayKey;
                    const isSelected = key === selectedDayKey;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelectDay(date)}
                            className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                                !inMonth ? "text-muted/50" : "text-foreground hover:bg-muted-surface"
                            } ${isSelected ? "bg-accent-soft ring-1 ring-accent/30" : ""}`}
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                    isToday ? "miniou-today-badge" : ""
                                }`}
                            >
                                {date.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                                <span className="mt-0.5 flex gap-0.5">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <span
                                            key={event.id}
                                            className="h-1 w-1 rounded-full bg-accent"
                                        />
                                    ))}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function formatDayHeading(date: Date) {
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

export function eventsForDay(events: CalendarEventSummary[], dayKey: string) {
    return events
        .filter((event) => eventDayKey(event.start) === dayKey)
        .sort((a, b) => (Date.parse(a.start) || 0) - (Date.parse(b.start) || 0));
}
