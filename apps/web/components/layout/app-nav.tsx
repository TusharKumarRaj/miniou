"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { MiniouButton, MiniouButtonLink } from "~/components/ui/miniou";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { useLoggedInUser, useSignOut } from "~/hooks/api/auth";
import { cn } from "~/lib/cn";

const NAV_LINKS = [
    { href: "/mail", label: "Mail", coachmarkId: "nav-mail" },
    { href: "/calendar", label: "Calendar", coachmarkId: "nav-calendar" },
    { href: "/chat", label: "Chat", coachmarkId: "nav-chat" },
    { href: "/settings/integrations", label: "Settings", coachmarkId: "nav-settings" },
] as const;

function LogoMark() {
    return (
        <span className="text-[1.1rem] font-semibold tracking-tight">miniou</span>
    );
}

export function AppNav({ variant = "app" }: { variant?: "landing" | "app" | "minimal" }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: user } = useLoggedInUser();
    const signOut = useSignOut();

    const headerClass =
        variant === "landing" ? "landing-nav-blur" : "border-border bg-background/80 backdrop-blur-xl";

    if (variant === "minimal") {
        return (
            <header className="absolute inset-x-0 top-0 z-50 px-6 py-6">
                <Link href="/">
                    <LogoMark />
                </Link>
            </header>
        );
    }

    return (
        <header className={cn("sticky top-0 z-50 border-b", headerClass)}>
            <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
                <Link href="/">
                    <LogoMark />
                </Link>

                {variant === "app" && user && (
                    <nav className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map((link) => {
                            const active = pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    data-coachmark={link.coachmarkId}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                                        active
                                            ? "miniou-nav-item-active"
                                            : "text-muted hover:bg-surface-hover hover:text-foreground",
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle coachmarkId="nav-theme" />
                    {user ? (
                        <>
                            {variant === "landing" && (
                                <MiniouButtonLink href="/chat" size="sm">
                                    Open app
                                </MiniouButtonLink>
                            )}
                            {variant === "app" && (
                                <MiniouButton
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={signOut.isPending}
                                    onClick={async () => {
                                        await signOut.mutateAsync({});
                                        router.push("/login");
                                    }}
                                >
                                    {signOut.isPending ? "…" : "Sign out"}
                                </MiniouButton>
                            )}
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hidden rounded-full px-4 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground sm:inline"
                            >
                                Sign in
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
