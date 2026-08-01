import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "doctools — clinical reasoning tools",
  description:
    "Tools that target documented errors in clinical reasoning. Everything runs in the browser; nothing is transmitted or stored.",
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
