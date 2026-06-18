import { Bebas_Neue } from "next/font/google";

import { AppShell } from "~/components/layout/app-shell";
import { LandingFooter } from "~/components/landing/footer";

const bebas = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-bebas",
});

export default function Home() {
    return (
        <div className={bebas.variable}>
            <AppShell variant="landing" background="landing" contentClassName="flex min-h-screen flex-col">
                <div className="flex flex-1 flex-col items-center justify-end px-6 pb-6 md:justify-center md:pb-0">
                    <div className="mb-auto mt-6 max-w-lg text-center md:mb-0 md:mt-[58vh] lg:mt-[62vh]">
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-miniou-red md:text-sm">
                            AI workspace
                        </p>
                        <h1 className="mt-3 text-xl font-medium leading-snug text-white/90 md:text-2xl">
                            Gmail, Calendar &amp; chat in one place
                        </h1>
                    </div>
                </div>

                <LandingFooter />
            </AppShell>
        </div>
    );
}
