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
    return (
        <div className={cn(glow ? "miniou-panel-glow" : "miniou-panel", className)}>{children}</div>
    );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonSizes = {
    sm: "px-3 py-1.5 text-[13px]",
    md: "px-4 py-2 text-[13px]",
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
            <button className={cn("miniou-btn-primary", buttonSizes[size], className)} {...props}>
                {children}
            </button>
        );
    }

    if (variant === "danger") {
        return (
            <button
                className={cn(
                    "rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-destructive transition hover:bg-red-500/15 disabled:opacity-50",
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
                    "rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    }

    return (
        <button className={cn("miniou-btn-secondary", buttonSizes[size], className)} {...props}>
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
    const classes =
        variant === "primary"
            ? cn("miniou-btn-primary", buttonSizes[size], className)
            : cn("miniou-btn-secondary", buttonSizes[size], className);

    return (
        <Link href={href} className={classes}>
            {children}
        </Link>
    );
}

export function MiniouInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
    return <input className={cn("miniou-input", className)} {...props} />;
}

export function MiniouTextarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
    return <textarea className={cn("miniou-input resize-y", className)} {...props} />;
}

export function MiniouLabel({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <span className={cn("mb-1.5 block text-[12px] font-medium text-muted", className)}>
            {children}
        </span>
    );
}

export function MiniouLink({ className, ...props }: ComponentPropsWithoutRef<typeof Link>) {
    return <Link className={cn("miniou-link text-[13px]", className)} {...props} />;
}

export function MiniouPageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
    );
}

export function MiniouLoading({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
            <p className="text-[12px] font-medium text-muted">{message}</p>
        </div>
    );
}
