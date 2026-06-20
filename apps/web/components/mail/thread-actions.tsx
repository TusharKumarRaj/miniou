"use client";

import { useRef, useState } from "react";

import { MiniouButton } from "~/components/ui/miniou";
import { cn } from "~/lib/cn";

const QUICK_EMOJIS = ["😀", "😊", "👍", "🙏", "❤️", "😂", "🎉", "✅", "🔥", "👀"] as const;

type ThreadActionsProps = {
    onReply: () => void;
    onForward: () => void;
    onInsertEmoji: (emoji: string) => void;
    className?: string;
};

function ReplyIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10a6 6 0 0 1 6 6v1" />
        </svg>
    );
}

function ForwardIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="m15 14 5 5-5 5" />
            <path d="M20 19H10a6 6 0 0 1-6-6v-1" />
        </svg>
    );
}

export function ThreadActions({ onReply, onForward, onInsertEmoji, className }: ThreadActionsProps) {
    const [emojiOpen, setEmojiOpen] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);

    return (
        <div className={cn("relative flex flex-wrap items-center gap-2", className)}>
            <MiniouButton type="button" variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={onReply}>
                <ReplyIcon />
                Reply
            </MiniouButton>
            <MiniouButton type="button" variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={onForward}>
                <ForwardIcon />
                Forward
            </MiniouButton>
            <div ref={emojiRef} className="relative">
                <MiniouButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="!px-2.5"
                    aria-label="Insert emoji"
                    onClick={() => setEmojiOpen((open) => !open)}
                >
                    <span className="text-base leading-none">🙂</span>
                </MiniouButton>
                {emojiOpen && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
                        {QUICK_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className="rounded-md px-1.5 py-1 text-lg transition hover:bg-muted-surface"
                                onClick={() => {
                                    onInsertEmoji(emoji);
                                    setEmojiOpen(false);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
