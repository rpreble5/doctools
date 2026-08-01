import type { ReactNode } from "react";

/**
 * The only label treatment in the system. One size, one weight, one
 * tracking value — so labels recede as a class instead of competing.
 */
export function Eyebrow({
  children,
  tone = "faint",
}: {
  children: ReactNode;
  tone?: "faint" | "contested";
}) {
  return (
    <p
      className={`m-0 text-[10px] font-semibold uppercase tracking-[0.15em] ${
        tone === "contested" ? "text-contested" : "text-faint"
      }`}
    >
      {children}
    </p>
  );
}
