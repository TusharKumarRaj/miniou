import { AppNav } from "~/components/layout/app-nav";
import { cn } from "~/lib/cn";

type AppShellProps = {
    children: React.ReactNode;
    variant?: "landing" | "app" | "auth";
    background?: string;
    className?: string;
    contentClassName?: string;
    hideNav?: boolean;
};

export function AppShell({
    children,
    variant = "app",
    className,
    contentClassName,
    hideNav = false,
}: AppShellProps) {
    const navVariant = variant === "auth" ? "minimal" : variant === "landing" ? "landing" : "app";

    return (
        <div className={cn("min-h-screen bg-background text-foreground", className)}>
            {!hideNav && <AppNav variant={navVariant} />}
            <div
                className={cn(
                    variant === "auth"
                        ? "flex min-h-screen items-center justify-center px-4 py-20"
                        : variant === "landing"
                          ? "flex flex-col"
                          : "mx-auto max-w-[1400px] px-4 pb-6 pt-4 sm:px-6",
                    contentClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}
