import { AppShell } from "~/components/layout/app-shell";
import {
    WorkspaceSidebar,
    type GmailMailboxLabel,
    type WorkspaceSection,
} from "~/components/workspace/sidebar";
import type { ScreenBackground } from "~/lib/screen-backgrounds";
import { cn } from "~/lib/cn";

type WorkspaceShellProps = {
    children: React.ReactNode;
    background: ScreenBackground;
    activeWorkspace: WorkspaceSection;
    activeMailboxLabel?: GmailMailboxLabel;
    onSelectMailbox?: (label: GmailMailboxLabel) => void;
    contentClassName?: string;
    mainClassName?: string;
};

export function WorkspaceShell({
    children,
    background,
    activeWorkspace,
    activeMailboxLabel,
    onSelectMailbox,
    contentClassName,
    mainClassName,
}: WorkspaceShellProps) {
    return (
        <AppShell
            background={background}
            contentClassName={cn(
                "mx-auto flex h-[calc(100dvh-0.75rem)] w-full max-w-7xl flex-col !pb-2 !pt-12 sm:!pt-14 md:!pt-[3.5rem]",
                contentClassName,
            )}
        >
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 lg:grid-cols-[200px_1fr]">
                <WorkspaceSidebar
                    activeWorkspace={activeWorkspace}
                    activeMailboxLabel={activeMailboxLabel}
                    onSelectMailbox={onSelectMailbox}
                />
                <div className={cn("flex h-full min-h-0 flex-col", mainClassName)}>{children}</div>
            </div>
        </AppShell>
    );
}
