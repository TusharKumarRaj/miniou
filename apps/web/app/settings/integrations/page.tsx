"use client";

import type { ReactNode } from "react";

import { WorkspaceShell } from "~/components/workspace/shell";
import {
    MiniouButton,
    MiniouButtonLink,
    MiniouLoading,
    MiniouPanel,
} from "~/components/ui/miniou";
import { useRequireAuth } from "~/hooks/api/auth";
import { useConnectUrl, useIntegrationStatus } from "~/hooks/api/integration";
import { cn } from "~/lib/cn";

function IntegrationCard({
    icon,
    title,
    description,
    connected,
    href,
    onConnect,
    connectPending,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    connected: boolean;
    href?: string;
    onConnect?: () => void;
    connectPending?: boolean;
}) {
    return (
        <MiniouPanel glow={connected} className="flex h-full flex-col p-5">
            <div className="grid flex-1 grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4">
                <div
                    className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border",
                        connected
                            ? "border-accent/30 bg-accent-soft text-accent"
                            : "border-border bg-muted-surface text-muted",
                    )}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-semibold leading-none">{title}</h3>
                        <span
                            className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                connected
                                    ? "bg-accent-soft text-accent"
                                    : "bg-muted-surface text-muted",
                            )}
                        >
                            {connected ? "Connected" : "Not connected"}
                        </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
                {connected && href ? (
                    <MiniouButtonLink href={href} size="sm" className="inline-flex">
                        Open {title}
                    </MiniouButtonLink>
                ) : (
                    <MiniouButton
                        type="button"
                        size="sm"
                        className="inline-flex"
                        onClick={onConnect}
                        disabled={connectPending}
                    >
                        {connectPending ? "Connecting…" : "Connect"}
                    </MiniouButton>
                )}
            </div>
        </MiniouPanel>
    );
}

function GmailIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 6h16v12H4z" />
            <path d="M4 7l8 6 8-6" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}

const PLAN_FEATURES = [
    "Gmail inbox & send via AI chat",
    "Google Calendar scheduling",
    "Natural language commands",
    "Multiple chat sessions",
] as const;

export default function IntegrationsPage() {
    const { data: user, isLoading: userLoading } = useRequireAuth();
    const { data: status, isLoading: statusLoading } = useIntegrationStatus();
    const gmailConnect = useConnectUrl();
    const calendarConnect = useConnectUrl();

    async function connect(plugin: "gmail" | "googlecalendar") {
        const connectUrl = plugin === "gmail" ? gmailConnect : calendarConnect;
        const { url } = await connectUrl.mutateAsync({ plugin });
        window.location.href = url;
    }

    if (userLoading || statusLoading) {
        return (
            <WorkspaceShell activeWorkspace="settings">
                <MiniouLoading />
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell activeWorkspace="settings" mainClassName="min-h-0 overflow-y-auto">
            <div className="pb-4">
                <p className="text-sm font-medium text-muted">Settings</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Integrations</h1>
                {user && <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>}
            </div>

            <div className="space-y-8 pb-4">
                <section>
                    <h2 className="text-sm font-semibold">Connected services</h2>
                    <p className="mt-1 mb-4 text-sm text-muted">
                        Connect Google so miniou can send email and manage your calendar from chat.
                    </p>
                    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                        <IntegrationCard
                            icon={<GmailIcon />}
                            title="Gmail"
                            description="Read and send email from your inbox. Powers AI chat and the mail workspace."
                            connected={status?.gmail ?? false}
                            href="/mail"
                            onConnect={() => connect("gmail")}
                            connectPending={gmailConnect.isPending}
                        />
                        <IntegrationCard
                            icon={<CalendarIcon />}
                            title="Google Calendar"
                            description="View events and schedule meetings. Used by chat and the calendar workspace."
                            connected={status?.googlecalendar ?? false}
                            href="/calendar"
                            onConnect={() => connect("googlecalendar")}
                            connectPending={calendarConnect.isPending}
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-semibold">Pricing & billing</h2>
                    <MiniouPanel className="mt-4 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold leading-none">Early access</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted">
                                    You&apos;re on the free early-access plan while miniou is in beta.
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-3xl font-bold leading-none">$0</p>
                                <p className="mt-1 text-xs text-muted">per month</p>
                            </div>
                        </div>

                        <ul className="mt-5 space-y-2 border-t border-border pt-5">
                            {PLAN_FEATURES.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                                    <span className="text-accent">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                            <MiniouButton type="button" size="sm" disabled>
                                Manage billing
                            </MiniouButton>
                            <span className="text-xs text-muted">Paid plans coming soon</span>
                        </div>
                    </MiniouPanel>
                </section>
            </div>
        </WorkspaceShell>
    );
}
