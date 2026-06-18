"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useLoggedInUser, useSignOut } from "~/hooks/api/auth";
import { cn } from "~/lib/cn";

const NAV_LINKS = [
    { href: "/", label: "Home", match: (p: string) => p === "/" },
    { href: "/mail", label: "Gmail", match: (p: string) => p.startsWith("/mail") },
    { href: "/calendar", label: "Calendar", match: (p: string) => p.startsWith("/calendar") },
    { href: "/chat", label: "Chat", match: (p: string) => p.startsWith("/chat") || p.startsWith("/dashboard") },
] as const;

function NavAuthAction() {
    const router = useRouter();
    const { data: user } = useLoggedInUser();
    const signOut = useSignOut();

    if (user) {
        return (
            <button
                type="button"
                className="miniou-cta-border rounded-md disabled:opacity-50"
                disabled={signOut.isPending}
                onClick={async () => {
                    await signOut.mutateAsync({});
                    router.push("/login");
                }}
            >
                <span className="block rounded-[5px] bg-black/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white/5 sm:px-5 sm:py-2.5 sm:text-[11px] md:text-xs">
                    {signOut.isPending ? "Signing out..." : "Logout"}
                </span>
            </button>
        );
    }

    return (
        <Link href="/signup" className="miniou-cta-border rounded-md">
            <span className="block rounded-[5px] bg-black/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white/5 sm:px-5 sm:py-2.5 sm:text-[11px] md:text-xs">
                Get started
            </span>
        </Link>
    );
}

export function AppNav({ variant = "app" }: { variant?: "landing" | "app" | "minimal" }) {
    const pathname = usePathname();
    const { data: user } = useLoggedInUser();
    const showNav = variant !== "minimal";
    const showWorkspaceNav = variant === "app" || Boolean(user);
    const showCta = variant === "landing";

    return (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-50 w-full pr-3 pt-0 pl-0 sm:pr-6 md:pr-8">
            <Link
                href="/"
                className="group pointer-events-auto absolute top-0 left-0 z-10 block w-[9.5rem] sm:w-[11rem] md:w-[12.5rem]"
            >
                <Image
                    src="/miniou_logo.svg"
                    alt="miniou"
                    width={200}
                    height={200}
                    className="h-14 w-full object-contain object-left-top transition group-hover:drop-shadow-[0_0_20px_rgba(255,31,31,0.5)] sm:h-16 md:h-20 lg:h-24"
                    priority
                />
            </Link>

            {showNav && (
                <nav className="pointer-events-none absolute top-2 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-8 text-[13px] font-medium tracking-wide md:top-3 md:gap-10 lg:flex">
                    {NAV_LINKS.map((link) => {
                        const active = link.match(pathname);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "pointer-events-auto transition",
                                    active ? "text-white" : "text-white/55 hover:text-white",
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                    {showWorkspaceNav && (
                        <Link
                            href="/settings/integrations"
                            className={cn(
                                "pointer-events-auto transition",
                                pathname.startsWith("/settings")
                                    ? "text-white"
                                    : "text-white/55 hover:text-white",
                            )}
                        >
                            Settings
                        </Link>
                    )}
                </nav>
            )}

            {showCta && (
                <div className="pointer-events-auto absolute top-2 right-3 z-20 sm:top-2.5 sm:right-6 md:right-8">
                    <NavAuthAction />
                </div>
            )}
        </header>
    );
}
