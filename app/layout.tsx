import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Share anonymously. Get a second view.",
  description:
    "Share what is weighing on you using a community name instead of your real name. Reflections are moderated, and mentor credentials are reviewed before responses.",
    icons: {
      icon: "/favicon.ico",
    },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Analytics />
    </html>
  );
}
