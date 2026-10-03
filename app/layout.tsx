import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second View — A quiet place for another perspective",
  description:
    "Share what is weighing on you and find thoughtful perspectives from verified professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
