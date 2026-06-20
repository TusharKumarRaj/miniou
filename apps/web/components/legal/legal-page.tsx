import { AppShell } from "~/components/layout/app-shell";
import { MiniouLink, MiniouPageTitle, MiniouPanel } from "~/components/ui/miniou";

type LegalPageProps = {
    title: string;
    children: React.ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
    return (
        <AppShell variant="landing" contentClassName="flex min-h-screen flex-col items-center py-16">
            <MiniouPanel glow className="w-full max-w-2xl p-8 md:p-10">
                <MiniouPageTitle title={title} subtitle="Last updated: June 13, 2026" />
                <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">{children}</div>
                <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6">
                    <MiniouLink href="/" className="no-underline hover:underline">
                        Home
                    </MiniouLink>
                    <MiniouLink href="/privacy" className="no-underline hover:underline">
                        Privacy
                    </MiniouLink>
                    <MiniouLink href="/terms" className="no-underline hover:underline">
                        Terms
                    </MiniouLink>
                </div>
            </MiniouPanel>
        </AppShell>
    );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
            {children}
        </section>
    );
}
