import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { AuthSessionSync } from "~/providers/auth-session-sync";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "miniou — AI for Gmail & Calendar",
  description: "Connect Gmail and Google Calendar. Send email and schedule meetings with natural language.",
  icons: {
    icon: "/miniou_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GlobalProviders>
          <AuthSessionSync />
          {children}
        </GlobalProviders>
      </body>
    </html>
  );
}
