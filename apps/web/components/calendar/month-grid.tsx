export type CalendarEventSummary = {
    id: string;
    title: string;
    start: string;
    end: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export function toDateKey(date: Date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function eventDayKey(start: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
        return start;
    }

    const date = new Date(start);
    if (Number.isNaN(date.getTime())) return "";
    return toDateKey(date);
}

export function getMonthGridRange(viewDate: Date) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    gridStart.setHours(0, 0, 0, 0);

    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    gridEnd.setHours(23, 59, 59, 999);

    return { gridStart, gridEnd, firstOfMonth, lastOfMonth };
}

export function buildMonthGrid(viewDate: Date) {
    const { gridStart, gridEnd, firstOfMonth, lastOfMonth } = getMonthGridRange(viewDate);
    const cells: Date[] = [];
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
        cells.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return { cells, firstOfMonth, lastOfMonth };
}

export function groupEventsByDay(events: CalendarEventSummary[]) {
    const map = new Map<string, CalendarEventSummary[]>();

    for (const event of events) {
        const key = eventDayKey(event.start);
        if (!key) continue;
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
    }

    for (const list of map.values()) {
        list.sort((a, b) => {
            const aMs = Date.parse(a.start) || 0;
            const bMs = Date.parse(b.start) || 0;
            return aMs - bMs;
        });
    }

    return map;
}

export function formatEventTime(start: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(start)) return "All day";

    const date = new Date(start);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatMonthYear(viewDate: Date) {
    return viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

type MonthGridProps = {
    viewDate: Date;
    events: CalendarEventSummary[];
    selectedEventId: string | null;
    selectedDayKey: string | null;
    onSelectDay: (date: Date) => void;
    onSelectEvent: (eventId: string) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
};

export function MonthCalendarGrid({
    viewDate,
    events,
    selectedEventId,
    selectedDayKey,
    onSelectDay,
    onSelectEvent,
    onPrevMonth,
    onNextMonth,
    onToday,
}: MonthGridProps) {
    const { cells, firstOfMonth, lastOfMonth } = buildMonthGrid(viewDate);
    const eventsByDay = groupEventsByDay(events);
    const todayKey = toDateKey(new Date());

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{formatMonthYear(viewDate)}</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToday}
                        className="miniou-btn-secondary px-3 py-1.5 text-sm"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        className="miniou-btn-secondary px-3 py-1.5 text-sm"
                        aria-label="Previous month"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="miniou-btn-secondary px-3 py-1.5 text-sm"
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-medium text-muted">
                {WEEKDAYS.map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
                {cells.map((date) => {
                    const key = toDateKey(date);
                    const inMonth = date >= firstOfMonth && date <= lastOfMonth;
                    const dayEvents = eventsByDay.get(key) ?? [];
                    const isToday = key === todayKey;
                    const isSelectedDay = key === selectedDayKey;

                    return (
                        <div
                            key={key}
                            className={`miniou-glass-subtle flex min-h-[88px] flex-col p-1.5 sm:min-h-[100px] sm:p-2 ${
                                !inMonth ? "opacity-40" : ""
                            } ${isSelectedDay ? "ring-1 ring-inset ring-foreground/20" : ""}`}
                        >
                            <button
                                type="button"
                                onClick={() => onSelectDay(date)}
                                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                                    isToday
                                        ? "miniou-today-badge"
                                        : "text-foreground hover:bg-muted-surface"
                                }`}
                            >
                                {date.getDate()}
                            </button>
                            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectEvent(event.id);
                                        }}
                                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] sm:text-xs ${
                                            selectedEventId === event.id
                                                ? "miniou-event-pill-active"
                                                : "miniou-event-pill"
                                        }`}
                                        title={event.title}
                                    >
                                        <span
                                            className={
                                                selectedEventId === event.id
                                                    ? "opacity-80 sm:mr-1"
                                                    : "opacity-70 sm:mr-1"
                                            }
                                        >
                                            {formatEventTime(event.start)}
                                        </span>
                                        {event.title}
                                    </button>
                                ))}
                                {dayEvents.length > 3 && (
                                    <p className="px-1 text-[10px] text-muted">
                                        +{dayEvents.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
