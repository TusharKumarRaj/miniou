import Link from "next/link";

import { AppShell } from "~/components/layout/app-shell";
import { MiniouButtonLink } from "~/components/ui/miniou";

const STEPS = [
    {
        num: "01",
        title: "Create your account",
        body: "Sign up with email or Google. Your workspace is ready in under a minute — no credit card during beta.",
    },
    {
        num: "02",
        title: "Connect Gmail & Calendar",
        body: "Authorize Google once in Settings → Integrations. miniou stores OAuth tokens securely and only acts when you ask.",
    },
    {
        num: "03",
        title: "Use one surface",
        body: "Mail, Calendar, and Chat live in the same workspace. Read inbox threads, check your schedule, and switch without opening new tabs.",
    },
    {
        num: "04",
        title: "Tell the AI what you need",
        body: "Type in chat: draft a reply, send an email, book a meeting, or check availability. The assistant uses your connected Gmail and Calendar to complete the task.",
    },
] as const;

const EXAMPLES = [
    "Draft a reply to the latest email from Alex and keep it under three sentences.",
    "Schedule a 30-minute call with Sam next Tuesday afternoon.",
    "What meetings do I have tomorrow?",
] as const;

export function HowItWorksPage() {
    return (
        <AppShell variant="landing" contentClassName="flex flex-col">
            <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-dim">Guide</p>
                <h1 className="voyance-headline-lowercase mt-4">how miniou works</h1>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
                    Gmail, Google Calendar, and AI chat in one workspace. Connect once, then manage your
                    day from a single screen.
                </p>

                <ol className="mt-14 space-y-10">
                    {STEPS.map((step) => (
                        <li key={step.num} className="grid gap-4 border-t border-white/8 pt-8 sm:grid-cols-[4rem_1fr]">
                            <p className="font-display text-2xl font-bold text-muted-dim">{step.num}</p>
                            <div>
                                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                                    {step.title}
                                </h2>
                                <p className="mt-2 text-[14px] leading-relaxed text-muted-dim">{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <section className="mt-16 border-t border-white/8 pt-10">
                    <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
                        Example prompts
                    </h2>
                    <ul className="mt-5 space-y-3">
                        {EXAMPLES.map((example) => (
                            <li
                                key={example}
                                className="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-muted"
                            >
                                &ldquo;{example}&rdquo;
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mt-16 flex flex-col gap-4 border-t border-white/8 pt-10 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                            Ready to try it?
                        </p>
                        <p className="mt-1 text-[13px] text-muted-dim">Free during beta · Connect Google in a minute</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/" className="voyance-pill-outline">
                            back home
                        </Link>
                        <MiniouButtonLink href="/signup">Get started</MiniouButtonLink>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
