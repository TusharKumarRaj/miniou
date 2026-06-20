import { AppShell } from "~/components/layout/app-shell";
import {
    WorkspaceSidebar,
    type GmailMailboxLabel,
    type WorkspaceSection,
} from "~/components/workspace/sidebar";
import { cn } from "~/lib/cn";

type WorkspaceShellProps = {
    children: React.ReactNode;
    background?: string;
    activeWorkspace: WorkspaceSection;
    activeMailboxLabel?: GmailMailboxLabel;
    onSelectMailbox?: (label: GmailMailboxLabel) => void;
    contentClassName?: string;
    mainClassName?: string;
};

export function WorkspaceShell({
    children,
    activeWorkspace,
    activeMailboxLabel,
    onSelectMailbox,
    contentClassName,
    mainClassName,
}: WorkspaceShellProps) {
    return (
        <AppShell
            contentClassName={cn(
                "flex h-[calc(100dvh-3rem)] flex-col !pb-3 !pt-3",
                contentClassName,
            )}
        >
            <div className="flex min-h-0 flex-1 gap-4">
                <WorkspaceSidebar
                    activeWorkspace={activeWorkspace}
                    activeMailboxLabel={activeMailboxLabel}
                    onSelectMailbox={onSelectMailbox}
                />
                <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", mainClassName)}>
                    {children}
                </div>
            </div>
        </AppShell>
    );
}
