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

/**
 * A set of factors. Results panels carry an availability state, because
 * a panel that has not come back is not the same as one that came back
 * normal — and only one of those two should reassure anybody.
 */
export function FactorGroup({
  label,
  availability,
  children,
}: {
  label: string;
  availability?: { available: boolean; onAvailable: (next: boolean) => void };
  children: ReactNode;
}) {
  const available = availability?.available ?? true;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {availability ? (
        <button
          type="button"
          aria-pressed={available}
          onClick={() => availability.onAvailable(!available)}
          className="flex items-center gap-2 self-start"
        >
          <span
            className={`grid h-[13px] w-[13px] flex-none place-items-center border ${
              available ? "border-ink bg-ink" : "border-rule"
            }`}
          >
            {available ? (
              <svg viewBox="0 0 10 8" className="h-1.5 w-2" aria-hidden="true">
                <path
                  d="M1 4.2 3.6 6.8 9 1.4"
                  fill="none"
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
              </svg>
            ) : null}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${
              available ? "text-soft" : "text-faint"
            }`}
          >
            {label}
          </span>
          {!available ? (
            <span className="text-[10.5px] text-faint">not back</span>
          ) : null}
        </button>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-soft">
          {label}
        </span>
      )}

      <div className={availability && !available ? "opacity-50" : undefined}>
        {children}
      </div>
    </div>
  );
}
