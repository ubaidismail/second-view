import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second View — A quiet place for another perspective",
  description:
    "Share what is weighing on you using a community name instead of your real name. Reflections are moderated, and mentor credentials are reviewed before responses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
