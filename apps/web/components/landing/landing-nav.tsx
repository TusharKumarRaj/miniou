"use client";

import Link from "next/link";

import { MiniouButtonLink } from "~/components/ui/miniou";
import { useLoggedInUser } from "~/hooks/api/auth";

const LANDING_LINKS = [
    { href: "/mail", label: "Mail" },
    { href: "/calendar", label: "Calendar" },
    { href: "/chat", label: "Chat" },
    { href: "/settings/integrations", label: "Integrations" },
] as const;

export function LandingNav() {
    const { data: user } = useLoggedInUser();

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
            <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="font-display shrink-0 text-[1.35rem] font-semibold tracking-tight"
                >
                    miniou
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {LANDING_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-muted transition hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                    {user ? (
                        <MiniouButtonLink href="/mail" size="sm">
                            Open app
                        </MiniouButtonLink>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hidden text-[0.9375rem] font-medium text-foreground sm:inline"
                            >
                                Login
                            </Link>
                            <MiniouButtonLink href="/signup" size="sm">
                                Get started
                            </MiniouButtonLink>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export function PromoBanner() {
    return (
        <div className="promo-banner">
            <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5 text-center text-sm sm:px-6">
                <span className="text-muted">AI assistant for work?</span>
                <span className="text-foreground">Send email and book meetings from chat.</span>
                <Link href="/chat" className="font-medium underline underline-offset-2">
                    Learn more →
                </Link>
            </div>
        </div>
    );
}
