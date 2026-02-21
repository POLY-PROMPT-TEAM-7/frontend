import type { Metadata } from "next";

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
            {children}
          </div>
          <ToastHost />
        </div>
      </body>
    </html>
  );
}
