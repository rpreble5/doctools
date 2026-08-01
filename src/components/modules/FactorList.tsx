"use client";

import type { ReactNode } from "react";

/**
 * The scoring factors, where toggling them happens.
 *
 * Input and breakdown are the same list. Showing a set of controls and
 * then a separate chart of what those controls produced is duplication
 * dressed up as explanation — the row that carries the points is the
 * row you click.
 */
export function Factor({
  label,
  points,
  active,
  onToggle,
  disabled = false,
}: {
  label: string;
  points: number;
  active: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onToggle(!active)}
      className={`group flex w-full items-baseline justify-between gap-3 border-b border-hair py-[5px] text-left transition-colors ${
        disabled
          ? "cursor-default opacity-40"
          : active
            ? "text-ink"
            : "text-faint hover:text-soft"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`h-[5px] w-[5px] flex-none rounded-full ${
            active ? "bg-scale" : "bg-rule"
          }`}
        />
        <span className="truncate text-[12.5px]">{label}</span>
      </span>
      <span
        className={`tnum flex-none font-mono text-[12px] ${
          active ? "text-ink" : "text-faint/70"
        }`}
      >
        {active ? points : `+${points}`}
      </span>
    </button>
  );
}

/** A named set of factors. */
export function FactorGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-soft">
        {label}
      </span>
      {children}
    </div>
  );
}
