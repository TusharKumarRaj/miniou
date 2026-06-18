import Link from "next/link";

const STATS = [
    { value: "Gmail", label: "Inbox & send" },
    { value: "Calendar", label: "Schedule meetings" },
    { value: "AI", label: "Natural language" },
] as const;

const SOCIAL_LINKS = [
    {
        href: "/mail",
        label: "Gmail",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
            </svg>
        ),
    },
    {
        href: "/calendar",
        label: "Calendar",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
            </svg>
        ),
    },
    {
        href: "/chat",
        label: "Chat",
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
        ),
    },
] as const;

export function LandingFooter() {
    return (
        <footer
            id="features"
            className="relative z-20 mt-auto grid gap-10 px-6 pb-8 pt-4 md:grid-cols-[1fr_auto] md:items-end md:px-12 md:pb-10"
        >
            <div className="flex flex-wrap gap-12 md:gap-16">
                {STATS.map((stat) => (
                    <div key={stat.value}>
                        <p className="miniou-stat-value text-4xl text-white md:text-5xl">
                            {stat.value}
                        </p>
                        <p className="mt-1.5 text-sm text-white/45">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-start gap-5 md:items-end">
                <p className="max-w-xs text-sm leading-relaxed text-white/40 md:text-right">
                    Connect Google once. Send mail and book meetings from chat or the
                    built-in workspace.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                    <Link href="/privacy" className="transition hover:text-white/70">
                        Privacy
                    </Link>
                    <Link href="/terms" className="transition hover:text-white/70">
                        Terms
                    </Link>
                </div>
                <div className="flex gap-3">
                    {SOCIAL_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={link.label}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-sm transition hover:scale-105 hover:border-miniou-red/50 hover:shadow-[0_0_24px_rgba(255,31,31,0.25)]"
                        >
                            {link.icon}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}
