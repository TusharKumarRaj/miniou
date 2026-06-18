import { AppNav } from "~/components/layout/app-nav";
import { cn } from "~/lib/cn";
import {
    resolveScreenBackground,
    SCREEN_BACKGROUNDS,
    type ScreenBackground,
} from "~/lib/screen-backgrounds";

type AppShellProps = {
    children: React.ReactNode;
    variant?: "landing" | "app" | "auth";
    background?: ScreenBackground;
    className?: string;
    contentClassName?: string;
};

export function AppShell({
    children,
    variant = "app",
    background,
    className,
    contentClassName,
}: AppShellProps) {
    const navVariant = variant === "auth" ? "minimal" : variant === "landing" ? "landing" : "app";
    const screen = SCREEN_BACKGROUNDS[resolveScreenBackground(variant, background)];

    return (
        <div className={cn("relative min-h-screen overflow-hidden bg-black text-white", className)}>
            <div
                aria-hidden
                className={cn(
                    "miniou-screen-bg pointer-events-none absolute inset-0",
                    screen.imageOpacity,
                )}
                style={{ backgroundImage: `url("${screen.image}")` }}
            />
            <div aria-hidden className={cn("pointer-events-none absolute inset-0", screen.overlay)} />

            <AppNav variant={navVariant} />

            <div
                className={cn(
                    "relative z-10",
                    variant === "landing"
                        ? "flex min-h-screen flex-col pt-20 sm:pt-24 md:pt-28"
                        : variant === "auth"
                          ? "flex min-h-screen items-center justify-center px-4 py-24"
                          : "px-4 pb-6 pt-20 sm:px-6 md:pt-24",
                    contentClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}
