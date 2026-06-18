import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "~/lib/cn";

export function MiniouPanel({
    className,
    children,
    glow = false,
}: {
    className?: string;
    children: React.ReactNode;
    glow?: boolean;
}) {
    if (glow) {
        return (
            <div className="miniou-panel-glow rounded-xl">
                <div className={cn("miniou-panel-inner h-full rounded-[11px]", className)}>
                    {children}
                </div>
            </div>
        );
    }

    return <div className={cn("miniou-panel", className)}>{children}</div>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonSizes = {
    sm: "px-4 py-2 text-[10px] sm:text-[11px]",
    md: "px-5 py-2.5 text-[11px] sm:text-xs",
};

export function MiniouButton({
    variant = "primary",
    size = "md",
    className,
    children,
    ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
    if (variant === "primary") {
        return (
            <button
                className={cn("miniou-cta-border block rounded-md disabled:opacity-50", className)}
                {...props}
            >
                <span
                    className={cn(
                        "block w-full rounded-[5px] bg-black/80 text-center font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white/5",
                        buttonSizes[size],
                    )}
                >
                    {children}
                </span>
            </button>
        );
    }

    if (variant === "danger") {
        return (
            <button
                className={cn(
                    "rounded-lg border border-miniou-red/40 bg-miniou-red/10 px-5 py-2 text-sm text-miniou-red transition hover:bg-miniou-red/20 disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    }

    if (variant === "ghost") {
        return (
            <button
                className={cn(
                    "text-sm text-white/55 transition hover:text-white disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    }

    return (
        <button
            className={cn("miniou-btn-secondary disabled:opacity-50", className)}
            {...props}
        >
            {children}
        </button>
    );
}

export function MiniouButtonLink({
    href,
    variant = "primary",
    size = "md",
    className,
    children,
}: {
    href: string;
    variant?: ButtonVariant;
    size?: "sm" | "md";
    className?: string;
    children: React.ReactNode;
}) {
    if (variant === "primary") {
        return (
            <Link href={href} className={cn("miniou-cta-border inline-block rounded-md", className)}>
                <span
                    className={cn(
                        "block rounded-[5px] bg-black/80 font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white/5",
                        buttonSizes[size],
                    )}
                >
                    {children}
                </span>
            </Link>
        );
    }

    return (
        <Link href={href} className={cn("miniou-btn-secondary inline-block text-center", className)}>
            {children}
        </Link>
    );
}

export function MiniouInput({
    className,
    ...props
}: ComponentPropsWithoutRef<"input">) {
    return <input className={cn("miniou-input", className)} {...props} />;
}

export function MiniouTextarea({
    className,
    ...props
}: ComponentPropsWithoutRef<"textarea">) {
    return <textarea className={cn("miniou-input resize-y", className)} {...props} />;
}

export function MiniouLabel({ className, children }: { className?: string; children: React.ReactNode }) {
    return <span className={cn("mb-1 block text-xs font-medium uppercase tracking-wider text-white/45", className)}>{children}</span>;
}

export function MiniouLink({ className, ...props }: ComponentPropsWithoutRef<typeof Link>) {
    return <Link className={cn("miniou-link text-sm", className)} {...props} />;
}

export function MiniouPageTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-miniou-red">
                miniou
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
        </div>
    );
}

export function MiniouLoading({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-miniou-red" />
            <p className="text-sm text-white/50">{message}</p>
        </div>
    );
}
