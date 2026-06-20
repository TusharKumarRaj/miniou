import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Syne } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { AuthSessionSync } from "~/providers/auth-session-sync";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
});

const syne = Syne({
    weight: ["500", "600", "700", "800"],
    subsets: ["latin"],
    variable: "--font-syne",
});

const instrumentSerif = Instrument_Serif({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-instrument-serif",
});

const ibmPlexMono = IBM_Plex_Mono({
    weight: ["400", "500"],
    subsets: ["latin"],
    variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
    title: "miniou — AI for Gmail & Calendar",
    description:
        "Connect Gmail and Google Calendar. Send email and schedule meetings with natural language.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" style={{ colorScheme: "dark" }}>
            <body
                className={`${geistSans.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} ${syne.variable} paper-bg antialiased`}
            >
                <GlobalProviders>
                    <AuthSessionSync />
                    {children}
                </GlobalProviders>
            </body>
        </html>
    );
}
