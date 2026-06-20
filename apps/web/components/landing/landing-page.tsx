"use client";

import Link from "next/link";

import { AppShell } from "~/components/layout/app-shell";
import { ImageSlot } from "~/components/landing/image-slot";
import { LANDING_ASSETS } from "~/components/landing/landing-assets";
import { useInView, useStagedReveal } from "~/components/landing/use-staged-reveal";
import { MiniouButtonLink } from "~/components/ui/miniou";
import { useLoggedInUser } from "~/hooks/api/auth";
import { cn } from "~/lib/cn";

function Reveal({
    show,
    children,
    className,
    scale,
}: {
    show: boolean;
    children: React.ReactNode;
    className?: string;
    scale?: boolean;
}) {
    return (
        <div className={cn(scale ? "voyance-reveal-scale" : "voyance-reveal", show && "is-visible", className)}>
            {children}
        </div>
    );
}

function LandingNav({ visible }: { visible: boolean }) {
    const { data: user } = useLoggedInUser();

    return (
        <header
            className={cn(
                "fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#030505]/65 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-700 supports-[backdrop-filter]:bg-[#030505]/50",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
        >
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 md:px-10">
                <Link href="/" className="shrink-0 text-[1.1rem] font-semibold tracking-tight text-foreground">
                    miniou
                </Link>

                <nav className="hidden items-center gap-1 sm:flex">
                    <a
                        href="#manifesto"
                        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground"
                    >
                        About
                    </a>
                    <a
                        href="#features"
                        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground"
                    >
                        Features
                    </a>
                    <a
                        href="#vision"
                        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground"
                    >
                        Vision
                    </a>
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    {user ? (
                        <MiniouButtonLink href="/mail" size="sm">
                            Open app
                        </MiniouButtonLink>
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

function HeroSection() {
    const { ref, inView } = useInView(0.15);
    const stage = useStagedReveal(inView, 3, 520);

    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-background pb-10 pt-16 md:pb-14"
        >
            <LandingNav visible={stage >= 3} />

            {/* Stage 1 — figure */}
            <div className="relative z-0 mx-auto flex w-full flex-1 items-start justify-center px-2 pt-8 md:px-4 md:pt-10">
                <Reveal
                    show={stage >= 1}
                    scale
                    className="relative aspect-[1672/941] w-full max-w-[min(98vw,960px)] -translate-y-2 md:-translate-y-4"
                >
                    <ImageSlot
                        src={LANDING_ASSETS.heroFigure}
                        alt="Hero figure"
                        label="hero-figure.svg"
                        fill
                        priority
                        unoptimized
                        className="h-full w-full"
                        imageClassName="object-center"
                    />
                </Reveal>
            </div>

            {/* Stage 2 — text around figure */}
            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 md:grid-cols-[1fr_auto] md:px-10">
                <Reveal show={stage >= 2} className="max-w-xl">
                    <h1 className="voyance-headline-lowercase">business workspace</h1>
                    <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
                        Strategic tools for people who manage email, calendar, and AI in one
                        place.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link href="/signup" className="voyance-pill">
                            get started
                        </Link>
                        <Link href="/how-it-works" className="voyance-pill-outline">
                            how it works
                        </Link>
                    </div>
                </Reveal>

                <Reveal show={stage >= 2} className="flex items-end justify-end">
                    <div className="max-w-[200px] pb-1 text-right">
                        <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                            Core aligned
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-dim">
                            Gmail, Calendar, and chat — one system.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function ManifestoSection() {
    const { ref, inView } = useInView(0.2);
    const stage = useStagedReveal(inView, 2, 600);

    return (
        <section
            id="manifesto"
            ref={ref as React.RefObject<HTMLElement>}
            className="flex min-h-[100dvh] flex-col justify-center border-t border-white/8 px-6 py-24 md:px-10"
        >
            <Reveal show={stage >= 1}>
                <h2 className="voyance-manifesto mx-auto max-w-5xl text-center uppercase">
                    <span className="text-muted-dim">Architecting a high-performance interface</span>
                    <br />
                    <span className="text-muted-dim">designed to </span>
                    <span className="text-muted-dim">transform </span>
                    <span className="text-foreground">complex workflows</span>
                    <br />
                    <span className="text-foreground">into clear action.</span>
                </h2>
                <p className="mx-auto mt-8 max-w-2xl text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-dim">
                    Stripping away interface noise to deliver maximum focus, speed, and compositional
                    discipline.
                </p>
            </Reveal>

            <Reveal show={stage >= 2} className="mx-auto mt-20 grid w-full max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
                {[
                    {
                        num: "01.Brief",
                        text: "Connect Gmail and Google Calendar. One account, one workspace.",
                    },
                    {
                        num: "02.Context",
                        text: "Your inbox and schedule feed an assistant that understands what you mean.",
                    },
                    {
                        num: "03.Challenge",
                        text: "Tab-switching between mail, calendar, and AI breaks focus.",
                    },
                    {
                        num: "04.Solution",
                        text: "A single chat surface to send email, book meetings, and manage your day.",
                    },
                    {
                        num: "05.Result",
                        text: "Less clicking. More doing. Everything stays in sync with Google.",
                    },
                ].map((item) => (
                    <div key={item.num}>
                        <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                            {item.num}
                        </p>
                        <p className="mt-3 text-[13px] leading-relaxed text-muted-dim">{item.text}</p>
                    </div>
                ))}
            </Reveal>
        </section>
    );
}

function TaskSolutionSection() {
    const { ref, inView } = useInView(0.2);
    const stage = useStagedReveal(inView, 2, 500);

    return (
        <section
            id="features"
            ref={ref as React.RefObject<HTMLElement>}
            className="relative min-h-[100dvh] overflow-hidden border-t border-white/8 bg-background"
        >
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,255,255,0.04) 0%, transparent 60%)",
                }}
            />

            <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between px-6 py-16 md:px-10 md:py-20">
                <Reveal show={stage >= 1} className="max-w-xs">
                    <h3 className="font-display text-5xl font-bold uppercase leading-none tracking-tight md:text-6xl">
                        One surface
                    </h3>
                    <p className="mt-2 text-sm text-muted">email, calendar, and AI together.</p>
                </Reveal>

                <div className="mx-auto max-w-2xl text-center">
                    <Reveal show={stage >= 1}>
                        <p className="font-display text-xl font-semibold uppercase leading-snug tracking-wide text-foreground md:text-2xl">
                            miniou connects Gmail and Google Calendar so you can send mail, book
                            meetings, and manage your day from a single chat.
                        </p>
                    </Reveal>
                </div>

                <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                    <Reveal show={stage >= 2} className="max-w-xs">
                        <h3 className="font-display text-5xl font-bold uppercase leading-none tracking-tight md:text-6xl">
                            Less noise
                        </h3>
                        <p className="mt-2 text-sm text-muted">fewer tabs, sharper focus.</p>
                    </Reveal>

                    <Reveal show={stage >= 2} className="max-w-md space-y-8 text-right">
                        <div>
                            <p className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
                                Inbox
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted-dim">
                                Read, search, and send email without leaving the workspace.
                            </p>
                        </div>
                        <div>
                            <p className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
                                Calendar
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted-dim">
                                Schedule meetings and check availability through natural language.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function VisionSection() {
    const { ref, inView } = useInView(0.15);
    const stage = useStagedReveal(inView, 2, 520);

    return (
        <section
            id="vision"
            ref={ref as React.RefObject<HTMLElement>}
            className="relative min-h-[100dvh] overflow-hidden border-t border-white/8 bg-background"
        >
            <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-center px-6 py-20 md:px-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
                    <Reveal show={stage >= 1} className="lg:pt-8">
                        <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-tight">
                            The new era
                            <br />
                            of <span className="text-foreground">workflow</span>
                        </h2>
                        <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-muted-dim">
                            Command your inbox and calendar through conversation. Connect once with
                            Google — stay in control.
                        </p>
                        <Link href="/signup" className="voyance-pill mt-8">
                            get started
                        </Link>
                    </Reveal>

                    <div className="flex flex-col justify-between gap-10 lg:items-end lg:text-right">
                        <Reveal show={stage >= 2}>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-dim">
                                Est. 2026
                            </p>
                            <h3 className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
                                From every
                                <br />
                                message
                            </h3>
                        </Reveal>

                        <Reveal show={stage >= 2} className="max-w-sm space-y-6 lg:ml-auto">
                            <div>
                                <p className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
                                    Natural language
                                </p>
                                <p className="mt-2 text-[13px] leading-relaxed text-muted-dim">
                                    Email sent, meetings booked — from a single prompt.
                                </p>
                            </div>
                            <p className="text-[13px] leading-relaxed text-muted-dim">
                                Gmail inbox, Google Calendar, and AI chat share one surface. No
                                tab-hopping. No copy-paste between tools.
                            </p>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CtaFooter() {
    return (
        <footer className="border-t border-white/8 px-6 py-16 md:px-10">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight">Ready to open miniou?</h2>
                    <p className="mt-2 text-muted-dim">Free during beta · Connect Google in a minute</p>
                </div>
                <MiniouButtonLink href="/signup" className="px-8 py-3">
                    Create account
                </MiniouButtonLink>
            </div>
            <div className="mx-auto mt-12 flex max-w-6xl flex-wrap gap-6 text-[13px] text-muted-dim">
                <Link href="/privacy" className="transition hover:text-foreground">
                    Privacy
                </Link>
                <Link href="/terms" className="transition hover:text-foreground">
                    Terms
                </Link>
                <Link href="/how-it-works" className="transition hover:text-foreground">
                    How it works
                </Link>
                <Link href="/login" className="transition hover:text-foreground">
                    Sign in
                </Link>
            </div>
        </footer>
    );
}

export function LandingPage() {
    return (
        <AppShell variant="landing" hideNav contentClassName="flex flex-col">
            <HeroSection />
            <ManifestoSection />
            <TaskSolutionSection />
            <VisionSection />
            <CtaFooter />
        </AppShell>
    );
}
