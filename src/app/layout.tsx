import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "doctools — clinical reasoning tools",
  description:
    "Tools that target documented errors in clinical reasoning. Everything runs in the browser; nothing is transmitted or stored.",
  // GitHub Pages is publicly reachable even from a private repository.
  // Keeping unreviewed clinical content out of search results is the
  // least this can do. Drop this once the content has been reviewed.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
