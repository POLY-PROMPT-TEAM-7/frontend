import type { Metadata } from "next";
import Link from "next/link";

import { ToastHost } from "@/components/ui/ToastHost";

import "./globals.css";

export const metadata: Metadata = {
  title: "KG Study Tool Demo",
  description: "Offline-demoable knowledge graph study assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="relative min-h-screen">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <Link href="/" className="text-sm font-semibold text-[var(--color-text)]">
                KG Study Tool
              </Link>
              <nav className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <Link href="/">Home</Link>
                <Link href="/app">App</Link>
                <Link href="/about">About</Link>
              </nav>
            </header>
            {children}
          </div>
          <ToastHost />
        </div>
      </body>
    </html>
  );
}
