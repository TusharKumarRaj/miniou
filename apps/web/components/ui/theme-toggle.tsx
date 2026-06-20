"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "~/lib/cn";

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1014 20.5 6.5 6.5 0 0020 14.5z" />
        </svg>
    );
}

export function ThemeToggle({
    className,
    showLabel = false,
    coachmarkId,
}: {
    className?: string;
    showLabel?: boolean;
    coachmarkId?: string;
}) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <span
                className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border",
                    className,
                )}
                aria-hidden
            />
        );
    }

    const isDark = resolvedTheme !== "light";

    return (
        <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            data-coachmark={coachmarkId}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-muted transition hover:bg-surface-hover hover:text-foreground",
                className,
            )}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
        </button>
    );
}
