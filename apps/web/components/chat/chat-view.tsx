"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { WorkspaceShell } from "~/components/workspace/shell";
import { ChatCoachmarkTour } from "~/components/chat/chat-coachmark-tour";
import { MiniouModal } from "~/components/ui/modal";
import {
    MiniouButton,
    MiniouInput,
    MiniouLoading,
    MiniouPanel,
    MiniouTextarea,
} from "~/components/ui/miniou";
import { useRequireAuth } from "~/hooks/api/auth";
import { useIntegrationStatus } from "~/hooks/api/integration";
import {
    useChatHistory,
    useChatSessions,
    useCancelCalendarPreview,
    useCancelEmailPreview,
    useConfirmCalendarEvent,
    useConfirmEmailSend,
    useCreateChatSession,
    usePrepareCalendarDraft,
    usePrepareEmailDraft,
    useSendChatMessage,
} from "~/hooks/api/meeting";
import { shouldPrepareCalendarDraft } from "~/lib/calendar-draft";
import {
    shouldPrepareEmailDraft,
} from "~/lib/email-draft";
import {
    CHAT_ATTACHMENT_MAX_COUNT,
    fileToPendingAttachment,
    formatAttachmentSize,
    isImageAttachment,
    pendingAttachmentToPayload,
    revokeAttachmentPreviews,
    type PendingChatAttachment,
} from "~/lib/chat-attachments";
import { cn } from "~/lib/cn";

const COMPOSER_PROMPTS = {
    schedule: "Schedule a meeting tomorrow at 2pm.",
    compose: "Draft an email to ",
} as const;

function formatSessionDate(iso: Date | string) {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sessionGroupLabel(iso: Date | string): string {
    const date = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function PaperclipIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M14 8l-4.5 4.5a2.5 2.5 0 0 0 3.5 3.5l5-5a4.5 4.5 0 0 0-6.4-6.4l-5.7 5.7a6 6 0 1 0 8.5 8.5l4.6-4.6" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
    );
}

function ComposeIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
    );
}

function ComposerIconButton({
    label,
    onClick,
    disabled,
    coachmarkId,
    children,
}: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    coachmarkId?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            data-coachmark={coachmarkId}
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}

type StoredAttachment = {
    name: string;
    mimeType: string;
    data: string;
};

function attachmentPreviewUrl(attachment: StoredAttachment) {
    return `data:${attachment.mimeType};base64,${attachment.data}`;
}

function asStoredAttachments(value: unknown): StoredAttachment[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
        (item): item is StoredAttachment =>
            typeof item === "object" &&
            item !== null &&
            typeof item.name === "string" &&
            typeof item.mimeType === "string" &&
            typeof item.data === "string",
    );
}

const GMAIL_ICON_URL =
    "https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png";

const GOOGLE_CALENDAR_ICON_URL =
    "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png";

function GmailLogo() {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- official Google CDN asset
        <img src={GMAIL_ICON_URL} alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
    );
}

function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    );
}

type CalendarDraft = {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
    timeZone: string;
    attendeeEmails: string[];
};

function toDatetimeLocalValue(iso: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
}

function formatPreviewRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "";

    return `${startDate.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })} – ${endDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function GoogleCalendarLogo() {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- official Google CDN asset
        <img
            src={GOOGLE_CALENDAR_ICON_URL}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 shrink-0"
        />
    );
}

function CalendarEventPreview({
    draft,
    onCreate,
    onDiscard,
    creating,
    discarding,
}: {
    draft: CalendarDraft;
    onCreate: (draft: CalendarDraft) => void;
    onDiscard: () => void;
    creating: boolean;
    discarding: boolean;
}) {
    const [title, setTitle] = useState(draft.title);
    const [description, setDescription] = useState(draft.description);
    const [location, setLocation] = useState(draft.location);
    const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(draft.start));
    const [endLocal, setEndLocal] = useState(toDatetimeLocalValue(draft.end));
    const [attendeesText, setAttendeesText] = useState(draft.attendeeEmails.join(", "));
    const disabled = creating || discarding;
    const canCreate = title.trim().length > 0 && startLocal && endLocal;

    useEffect(() => {
        setTitle(draft.title);
        setDescription(draft.description);
        setLocation(draft.location);
        setStartLocal(toDatetimeLocalValue(draft.start));
        setEndLocal(toDatetimeLocalValue(draft.end));
        setAttendeesText(draft.attendeeEmails.join(", "));
    }, [
        draft.title,
        draft.description,
        draft.location,
        draft.start,
        draft.end,
        draft.attendeeEmails,
    ]);

    function handleCreate() {
        if (!canCreate || disabled) return;

        onCreate({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            start: fromDatetimeLocalValue(startLocal),
            end: fromDatetimeLocalValue(endLocal),
            timeZone: draft.timeZone || "UTC",
            attendeeEmails: attendeesText
                .split(/[,;\s]+/)
                .map((email) => email.trim())
                .filter(Boolean),
        });
    }

    const previewRange = formatPreviewRange(
        fromDatetimeLocalValue(startLocal),
        fromDatetimeLocalValue(endLocal),
    );

    return (
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <GoogleCalendarLogo />
                    <span className="text-[14px] font-medium text-[#202124]">New Event</span>
                </div>
                <button
                    type="button"
                    aria-label="Discard draft"
                    onClick={onDiscard}
                    disabled={disabled}
                    className="rounded p-1 text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-50"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-0 border-b border-[#e8eaed] px-4 py-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={disabled}
                    placeholder="Add title"
                    className="w-full bg-transparent text-[18px] font-normal text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
                />
                {previewRange ? (
                    <p className="mt-1 text-[13px] text-[#5f6368]">{previewRange}</p>
                ) : null}
            </div>

            <div className="grid gap-3 border-b border-[#e8eaed] px-4 py-3">
                <label className="grid gap-1">
                    <span className="text-[12px] font-medium text-[#5f6368]">Start</span>
                    <input
                        type="datetime-local"
                        value={startLocal}
                        onChange={(e) => setStartLocal(e.target.value)}
                        disabled={disabled}
                        className="w-full rounded-md border border-[#dadce0] px-2.5 py-2 text-[13px] text-[#202124] outline-none disabled:opacity-50"
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-[12px] font-medium text-[#5f6368]">End</span>
                    <input
                        type="datetime-local"
                        value={endLocal}
                        onChange={(e) => setEndLocal(e.target.value)}
                        disabled={disabled}
                        className="w-full rounded-md border border-[#dadce0] px-2.5 py-2 text-[13px] text-[#202124] outline-none disabled:opacity-50"
                    />
                </label>
            </div>

            <div className="border-b border-[#e8eaed] px-4 py-2.5">
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={disabled}
                    placeholder="Add location"
                    className="w-full bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
                />
            </div>

            <div className="border-b border-[#e8eaed] px-4 py-2.5">
                <input
                    type="text"
                    value={attendeesText}
                    onChange={(e) => setAttendeesText(e.target.value)}
                    disabled={disabled}
                    placeholder="Add guests (emails separated by commas)"
                    className="w-full bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
                />
            </div>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={disabled}
                placeholder="Add description"
                rows={4}
                className="min-h-[96px] w-full resize-none bg-white px-4 py-3 text-[13px] leading-relaxed text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    onClick={onDiscard}
                    disabled={disabled}
                    className="text-[13px] font-medium text-[#5f6368] transition hover:text-[#202124] disabled:opacity-50"
                >
                    {discarding ? "Discarding…" : "Discard"}
                </button>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={disabled || !canCreate}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1765cc] disabled:opacity-50"
                >
                    {creating ? "Creating…" : "Create"}
                </button>
            </div>
        </div>
    );
}

function EmailComposePreview({
    draft,
    onSend,
    onDiscard,
    sending,
    discarding,
}: {
    draft: { to: string; subject: string; body: string };
    onSend: (draft: { to: string; subject: string; body: string }) => void;
    onDiscard: () => void;
    sending: boolean;
    discarding: boolean;
}) {
    const [to, setTo] = useState(draft.to);
    const [subject, setSubject] = useState(draft.subject);
    const [body, setBody] = useState(draft.body);
    const [editingTo, setEditingTo] = useState(!draft.to.trim());
    const disabled = sending || discarding;
    const canSend = to.trim().length > 0 && body.trim().length > 0;

    useEffect(() => {
        setTo(draft.to);
        setSubject(draft.subject);
        setBody(draft.body);
        setEditingTo(!draft.to.trim());
    }, [draft.to, draft.subject, draft.body]);

    function handleSend() {
        if (!canSend || disabled) return;
        onSend({ to: to.trim(), subject: subject.trim(), body: body.trim() });
    }

    return (
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <GmailLogo />
                    <span className="text-[14px] font-medium text-[#202124]">New Message</span>
                </div>
                <button
                    type="button"
                    aria-label="Discard draft"
                    onClick={onDiscard}
                    disabled={disabled}
                    className="rounded p-1 text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-50"
                >
                    ✕
                </button>
            </div>

            <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-2.5">
                <span className="shrink-0 text-[13px] text-[#5f6368]">To</span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    {editingTo ? (
                        <input
                            type="email"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            onBlur={() => {
                                if (to.trim()) setEditingTo(false);
                            }}
                            disabled={disabled}
                            autoFocus
                            placeholder="Recipients"
                            className="min-w-[160px] flex-1 bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingTo(true)}
                            disabled={disabled}
                            className="inline-flex max-w-full items-center rounded-full bg-[#e8eaed] px-2.5 py-1 text-[13px] text-[#202124] transition hover:bg-[#dadce0] disabled:opacity-50"
                        >
                            <span className="truncate">{to}</span>
                        </button>
                    )}
                    {!editingTo && (
                        <button
                            type="button"
                            onClick={() => setEditingTo(true)}
                            disabled={disabled}
                            className="text-[13px] text-[#80868b] hover:text-[#202124] disabled:opacity-50"
                        >
                            Add another…
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b border-[#e8eaed] px-4 py-2.5">
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={disabled}
                    placeholder="Subject"
                    className="w-full bg-transparent text-[13px] font-normal text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
                />
            </div>

            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={disabled}
                placeholder="Write your message…"
                rows={7}
                className="min-h-[160px] w-full resize-none bg-white px-4 py-3 text-[13px] leading-relaxed text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    onClick={onDiscard}
                    disabled={disabled}
                    className="text-[13px] font-medium text-[#5f6368] transition hover:text-[#202124] disabled:opacity-50"
                >
                    {discarding ? "Discarding…" : "Discard"}
                </button>
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={disabled || !canSend}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1765cc] disabled:opacity-50"
                >
                    <SendIcon />
                    {sending ? "Sending…" : "Send"}
                </button>
            </div>
        </div>
    );
}

function MessageAttachments({ attachments }: { attachments: StoredAttachment[] }) {
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((attachment) =>
                isImageAttachment(attachment.mimeType) ? (
                    <img
                        key={attachment.name}
                        src={attachmentPreviewUrl(attachment)}
                        alt={attachment.name}
                        className="max-h-40 max-w-full rounded-lg border border-border object-cover"
                    />
                ) : (
                    <span
                        key={attachment.name}
                        className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
                    >
                        {attachment.name}
                    </span>
                ),
            )}
        </div>
    );
}

function PendingAttachmentList({
    attachments,
    onRemove,
}: {
    attachments: PendingChatAttachment[];
    onRemove: (id: string) => void;
}) {
    if (attachments.length === 0) return null;

    return (
        <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
                <div
                    key={attachment.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px]"
                >
                    {attachment.previewUrl ? (
                        <img
                            src={attachment.previewUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                        />
                    ) : (
                        <span className="text-muted">📎</span>
                    )}
                    <span className="truncate">{attachment.name}</span>
                    <span className="text-muted">{formatAttachmentSize(attachment.size)}</span>
                    <button
                        type="button"
                        aria-label={`Remove ${attachment.name}`}
                        onClick={() => onRemove(attachment.id)}
                        className="rounded px-1 text-muted transition hover:bg-surface-hover hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

type ChatComposerProps = {
    message: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled: boolean;
    large?: boolean;
    attachments: PendingChatAttachment[];
    onAttachFiles: (files: FileList | File[]) => void;
    onRemoveAttachment: (id: string) => void;
    attachmentError?: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
};

function ChatComposer({
    message,
    onChange,
    onSubmit,
    disabled,
    large,
    attachments,
    onAttachFiles,
    onRemoveAttachment,
    attachmentError,
    fileInputRef,
}: ChatComposerProps) {
    const canSend = !disabled && (message.trim().length > 0 || attachments.length > 0);

    function handleMultilineKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) {
                e.currentTarget.form?.requestSubmit();
            }
        }
    }

    return (
        <form onSubmit={onSubmit} className="w-full" data-coachmark="chat-composer">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) {
                        onAttachFiles(e.target.files);
                    }
                    e.target.value = "";
                }}
            />
            <MiniouPanel className={cn(large ? "p-4" : "p-3")}>
                <PendingAttachmentList attachments={attachments} onRemove={onRemoveAttachment} />
                {large ? (
                    <MiniouTextarea
                        value={message}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Send an email, check calendar, draft a reply…"
                        disabled={disabled}
                        rows={4}
                        className="min-h-[112px] w-full resize-none border-0 bg-transparent px-1 py-1 focus:ring-0"
                        onKeyDown={handleMultilineKeyDown}
                    />
                ) : (
                    <MiniouInput
                        type="text"
                        value={message}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Send an email or schedule a meeting…"
                        className="w-full border-0 bg-transparent px-1 py-0 focus:ring-0"
                        disabled={disabled}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (canSend) {
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }
                        }}
                    />
                )}

                <div
                    className={cn(
                        "flex items-center justify-between gap-3 border-t border-border",
                        large ? "mt-4 pt-3" : "mt-3 pt-2",
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <ComposerIconButton
                            label="Attach file"
                            coachmarkId="chat-attach"
                            disabled={disabled || attachments.length >= CHAT_ATTACHMENT_MAX_COUNT}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <PaperclipIcon />
                        </ComposerIconButton>
                        <ComposerIconButton
                            label="Schedule"
                            coachmarkId="chat-schedule"
                            onClick={() => onChange(COMPOSER_PROMPTS.schedule)}
                        >
                            <CalendarIcon />
                        </ComposerIconButton>
                        <ComposerIconButton
                            label="Compose"
                            coachmarkId="chat-compose"
                            onClick={() => onChange(COMPOSER_PROMPTS.compose)}
                        >
                            <ComposeIcon />
                        </ComposerIconButton>
                    </div>

                    <MiniouButton type="submit" size="sm" disabled={!canSend} data-coachmark="chat-send">
                        Send
                    </MiniouButton>
                </div>
            </MiniouPanel>
            {attachmentError && (
                <p className="mt-2 text-[13px] text-destructive">{attachmentError}</p>
            )}
        </form>
    );
}

export function ChatView({ sessionId }: { sessionId?: string }) {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useRequireAuth();
    const { data: status, isLoading: statusLoading } = useIntegrationStatus();
    const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
    const createSession = useCreateChatSession();
    const { data: history, isLoading: historyLoading } = useChatHistory(sessionId ?? null);
    const sendMessage = useSendChatMessage(sessionId ?? null);
    const prepareEmailDraft = usePrepareEmailDraft(sessionId ?? null);
    const prepareCalendarDraft = usePrepareCalendarDraft(sessionId ?? null);
    const confirmEmail = useConfirmEmailSend(sessionId ?? null);
    const cancelEmail = useCancelEmailPreview(sessionId ?? null);
    const confirmCalendar = useConfirmCalendarEvent(sessionId ?? null);
    const cancelCalendar = useCancelCalendarPreview(sessionId ?? null);
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState<PendingChatAttachment[]>([]);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [bootstrapping, setBootstrapping] = useState(!sessionId);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [localPendingEmail, setLocalPendingEmail] = useState<{
        to: string;
        subject: string;
        body: string;
    } | null>(null);
    const [localPendingCalendar, setLocalPendingCalendar] = useState<CalendarDraft | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentsRef = useRef(attachments);
    attachmentsRef.current = attachments;

    const firstName = user?.fullName?.split(/\s+/)[0] ?? "there";
    const chatBusy =
        sendMessage.isPending || prepareEmailDraft.isPending || prepareCalendarDraft.isPending;
    const hasMessages = (history?.messages.length ?? 0) > 0 || chatBusy;
    const pendingEmail =
        localPendingEmail ??
        history?.pendingEmail ??
        prepareEmailDraft.data?.pendingEmail ??
        sendMessage.data?.pendingEmail ??
        null;
    const pendingCalendar =
        localPendingCalendar ??
        history?.pendingCalendar ??
        prepareCalendarDraft.data?.pendingCalendar ??
        sendMessage.data?.pendingCalendar ??
        null;
    const emailActionPending =
        confirmEmail.isPending ||
        cancelEmail.isPending ||
        prepareEmailDraft.isPending;
    const calendarActionPending =
        confirmCalendar.isPending ||
        cancelCalendar.isPending ||
        prepareCalendarDraft.isPending;

    useEffect(() => {
        if (history?.pendingEmail) {
            setLocalPendingEmail(history.pendingEmail);
        }
    }, [history?.pendingEmail]);

    useEffect(() => {
        if (history?.pendingCalendar) {
            setLocalPendingCalendar(history.pendingCalendar);
        }
    }, [history?.pendingCalendar]);

    useEffect(() => {
        if (prepareEmailDraft.data?.pendingEmail) {
            setLocalPendingEmail(prepareEmailDraft.data.pendingEmail);
        }
    }, [prepareEmailDraft.data?.pendingEmail]);

    useEffect(() => {
        if (prepareCalendarDraft.data?.pendingCalendar) {
            setLocalPendingCalendar(prepareCalendarDraft.data.pendingCalendar);
        }
    }, [prepareCalendarDraft.data?.pendingCalendar]);

    useEffect(() => {
        if (sendMessage.data?.pendingEmail) {
            setLocalPendingEmail(sendMessage.data.pendingEmail);
        }
    }, [sendMessage.data?.pendingEmail]);

    useEffect(() => {
        if (sendMessage.data?.pendingCalendar) {
            setLocalPendingCalendar(sendMessage.data.pendingCalendar);
        }
    }, [sendMessage.data?.pendingCalendar]);

    useEffect(() => {
        return () => {
            revokeAttachmentPreviews(attachmentsRef.current);
        };
    }, []);

    const groupedSessions = useMemo(() => {
        const sessions = sessionsData?.sessions ?? [];
        const groups = new Map<string, typeof sessions>();

        for (const session of sessions) {
            const label = sessionGroupLabel(session.updatedAt);
            const bucket = groups.get(label) ?? [];
            bucket.push(session);
            groups.set(label, bucket);
        }

        return [...groups.entries()];
    }, [sessionsData?.sessions]);

    useEffect(() => {
        if (!statusLoading && status && !status.gmail) {
            router.push("/settings/integrations");
        }
    }, [status, statusLoading, router]);

    useEffect(() => {
        if (sessionId || sessionsLoading || createSession.isPending) return;

        const sessions = sessionsData?.sessions ?? [];
        if (sessions.length > 0) {
            router.replace(`/chat/${sessions[0]!.id}`);
            return;
        }

        setBootstrapping(true);
        void createSession.mutateAsync({}).then((result) => {
            router.replace(`/chat/${result.session.id}`);
        });
    }, [sessionId, sessionsLoading, sessionsData, createSession, router]);

    async function handleNewChat() {
        const result = await createSession.mutateAsync({});
        setHistoryOpen(false);
        router.push(`/chat/${result.session.id}`);
    }

    async function handleAttachFiles(files: FileList | File[]) {
        setAttachmentError(null);
        const selected = Array.from(files);

        if (attachments.length + selected.length > CHAT_ATTACHMENT_MAX_COUNT) {
            setAttachmentError(`You can attach up to ${CHAT_ATTACHMENT_MAX_COUNT} files.`);
            return;
        }

        try {
            const next = await Promise.all(selected.map((file) => fileToPendingAttachment(file)));
            setAttachments((current) => [...current, ...next]);
        } catch (error) {
            setAttachmentError(error instanceof Error ? error.message : "Could not attach file.");
        }
    }

    function handleRemoveAttachment(id: string) {
        setAttachments((current) => {
            const removed = current.find((attachment) => attachment.id === id);
            if (removed?.previewUrl) {
                URL.revokeObjectURL(removed.previewUrl);
            }
            return current.filter((attachment) => attachment.id !== id);
        });
        setAttachmentError(null);
    }

    async function handleConfirmEmail(editedDraft: { to: string; subject: string; body: string }) {
        if (!sessionId) return;
        await confirmEmail.mutateAsync({ sessionId, draft: editedDraft });
        setLocalPendingEmail(null);
        prepareEmailDraft.reset();
    }

    async function handleCancelEmail() {
        if (!sessionId) return;
        await cancelEmail.mutateAsync({ sessionId });
        setLocalPendingEmail(null);
        prepareEmailDraft.reset();
    }

    async function handleConfirmCalendar(editedDraft: CalendarDraft) {
        if (!sessionId) return;
        await confirmCalendar.mutateAsync({ sessionId, draft: editedDraft });
        setLocalPendingCalendar(null);
        prepareCalendarDraft.reset();
    }

    async function handleCancelCalendar() {
        if (!sessionId) return;
        await cancelCalendar.mutateAsync({ sessionId });
        setLocalPendingCalendar(null);
        prepareCalendarDraft.reset();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if ((!message.trim() && attachments.length === 0) || !sessionId) return;

        const text = message.trim();
        const payloadAttachments = attachments.map(pendingAttachmentToPayload);
        const pendingAttachments = attachments;
        const conversationText = history?.messages.map((entry) => entry.content).join("\n") ?? "";
        const useEmailDraft =
            attachments.length === 0 && shouldPrepareEmailDraft(text, conversationText);
        const useCalendarDraft =
            attachments.length === 0 &&
            !useEmailDraft &&
            status?.googlecalendar &&
            shouldPrepareCalendarDraft(text);

        setMessage("");
        setAttachments([]);
        setAttachmentError(null);
        revokeAttachmentPreviews(pendingAttachments);

        if (useEmailDraft) {
            setLocalPendingEmail(null);

            await prepareEmailDraft.mutateAsync({
                sessionId,
                message: text,
            });
            return;
        }

        if (useCalendarDraft) {
            setLocalPendingCalendar(null);

            await prepareCalendarDraft.mutateAsync({
                sessionId,
                message: text,
            });
            return;
        }

        await sendMessage.mutateAsync({
            sessionId,
            message: text,
            attachments: payloadAttachments.length > 0 ? payloadAttachments : undefined,
        });
    }

    if (userLoading || statusLoading || sessionsLoading || (bootstrapping && !sessionId)) {
        return (
            <WorkspaceShell activeWorkspace="chat">
                <MiniouLoading message="Loading chat..." />
            </WorkspaceShell>
        );
    }

    if (!sessionId) {
        return (
            <WorkspaceShell activeWorkspace="chat">
                <MiniouLoading message="Starting chat..." />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell activeWorkspace="chat">
            <ChatCoachmarkTour ready={!historyLoading} />
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center justify-end gap-2 pb-4">
                    <MiniouButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Open chat history"
                        data-coachmark="chat-history"
                        onClick={() => setHistoryOpen(true)}
                    >
                        History
                    </MiniouButton>
                    <MiniouButton
                        type="button"
                        size="sm"
                        data-coachmark="chat-new"
                        onClick={handleNewChat}
                    >
                        New chat
                    </MiniouButton>
                </div>

                {historyLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <MiniouLoading message="Loading messages..." />
                    </div>
                ) : hasMessages ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-1 py-2">
                                {history?.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex",
                                            msg.role === "user" ? "justify-end" : "justify-start",
                                        )}
                                    >
                                        <div
                                            className={
                                                msg.role === "user"
                                                    ? "miniou-chat-bubble-user"
                                                    : "miniou-chat-bubble-assistant"
                                            }
                                        >
                                            {msg.content}
                                            {asStoredAttachments(msg.attachments).length > 0 ? (
                                                <MessageAttachments
                                                    attachments={asStoredAttachments(msg.attachments)}
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {(sendMessage.isPending ||
                                    prepareEmailDraft.isPending ||
                                    prepareCalendarDraft.isPending) &&
                                    (sendMessage.variables?.message ||
                                        prepareEmailDraft.variables?.message ||
                                        prepareCalendarDraft.variables?.message) && (
                                    <div className="flex justify-end">
                                        <div className="miniou-chat-bubble-user">
                                            {sendMessage.variables?.message ??
                                                prepareEmailDraft.variables?.message ??
                                                prepareCalendarDraft.variables?.message}
                                            {sendMessage.variables?.attachments?.length ? (
                                                <MessageAttachments
                                                    attachments={asStoredAttachments(
                                                        sendMessage.variables.attachments,
                                                    )}
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                                {sendMessage.isPending && (
                                    <div className="flex justify-start">
                                        <p className="miniou-chat-bubble-assistant text-muted">Thinking…</p>
                                    </div>
                                )}
                                {prepareEmailDraft.isPending && (
                                    <div className="flex justify-start">
                                        <p className="miniou-chat-bubble-assistant text-muted">
                                            Drafting email…
                                        </p>
                                    </div>
                                )}
                                {prepareCalendarDraft.isPending && (
                                    <div className="flex justify-start">
                                        <p className="miniou-chat-bubble-assistant text-muted">
                                            Drafting calendar event…
                                        </p>
                                    </div>
                                )}
                                {pendingEmail && (
                                    <div className="flex justify-start">
                                        <EmailComposePreview
                                            draft={pendingEmail}
                                            onSend={handleConfirmEmail}
                                            onDiscard={handleCancelEmail}
                                            sending={confirmEmail.isPending}
                                            discarding={cancelEmail.isPending}
                                        />
                                    </div>
                                )}
                                {pendingCalendar && (
                                    <div className="flex justify-start">
                                        <CalendarEventPreview
                                            draft={pendingCalendar}
                                            onCreate={handleConfirmCalendar}
                                            onDiscard={handleCancelCalendar}
                                            creating={confirmCalendar.isPending}
                                            discarding={cancelCalendar.isPending}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-2xl shrink-0 pt-3">
                            <ChatComposer
                                message={message}
                                onChange={setMessage}
                                onSubmit={handleSubmit}
                                disabled={chatBusy || emailActionPending || calendarActionPending}
                                attachments={attachments}
                                onAttachFiles={handleAttachFiles}
                                onRemoveAttachment={handleRemoveAttachment}
                                attachmentError={attachmentError}
                                fileInputRef={fileInputRef}
                            />
                            {(sendMessage.error ||
                                prepareEmailDraft.error ||
                                prepareCalendarDraft.error) && (
                                <p className="mt-2 text-[13px] text-destructive">
                                    {sendMessage.error?.message ??
                                        prepareEmailDraft.error?.message ??
                                        prepareCalendarDraft.error?.message}
                                </p>
                            )}
                            {confirmEmail.error && (
                                <p className="mt-2 text-[13px] text-destructive">
                                    {confirmEmail.error.message}
                                </p>
                            )}
                            {confirmCalendar.error && (
                                <p className="mt-2 text-[13px] text-destructive">
                                    {confirmCalendar.error.message}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-8">
                        <div className="w-full max-w-2xl text-center">
                            <h1 className="text-3xl font-bold tracking-tight">Hello, {firstName}.</h1>
                            <p className="mt-2 text-muted">What&apos;s on your mind today?</p>
                        </div>

                        <div className="mt-10 w-full max-w-2xl">
                            <ChatComposer
                                message={message}
                                onChange={setMessage}
                                onSubmit={handleSubmit}
                                disabled={chatBusy}
                                large
                                attachments={attachments}
                                onAttachFiles={handleAttachFiles}
                                onRemoveAttachment={handleRemoveAttachment}
                                attachmentError={attachmentError}
                                fileInputRef={fileInputRef}
                            />
                            {(sendMessage.error ||
                                prepareEmailDraft.error ||
                                prepareCalendarDraft.error) && (
                                <p className="mt-2 text-center text-[13px] text-destructive">
                                    {sendMessage.error?.message ??
                                        prepareEmailDraft.error?.message ??
                                        prepareCalendarDraft.error?.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <MiniouModal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Chat history">
                <div className="space-y-5">
                    {(sessionsData?.sessions.length ?? 0) === 0 && (
                        <p className="text-sm text-muted">No chats yet.</p>
                    )}
                    {groupedSessions.map(([label, sessions]) => (
                        <div key={label}>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                                {label}
                            </p>
                            <div className="space-y-1">
                                {sessions.map((session) => {
                                    const active = session.id === sessionId;
                                    return (
                                        <Link
                                            key={session.id}
                                            href={`/chat/${session.id}`}
                                            onClick={() => setHistoryOpen(false)}
                                            className={cn(
                                                "block rounded-lg px-3 py-2.5 transition",
                                                active
                                                    ? "miniou-nav-item-active"
                                                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                                            )}
                                        >
                                            <p className="truncate text-[13px] font-medium">{session.title}</p>
                                            <p className="mt-0.5 text-[11px] text-muted">
                                                {formatSessionDate(session.updatedAt)}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </MiniouModal>
        </WorkspaceShell>
    );
}
