"use client";

import type { ReactNode } from "react";

/** A compact numeric input. Neutral chrome — no colour, ever. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <input
          type="number"
          value={Number.isNaN(value) ? "" : value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="tnum w-16 border-b border-rule bg-transparent pb-1 font-mono text-[15px] tracking-[-0.02em] text-ink outline-none focus:border-ink"
        />
        {suffix ? (
          <span className="text-[11px] text-faint">{suffix}</span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * A continuous value, set by dragging.
 *
 * Reserved for the few quantities that are genuinely continuous. Most
 * clinical scores want a single bit at a cut point, and a slider for
 * those is just a slower toggle.
 */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  note,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Shown beside the value — usually what the number means for the score. */
  note?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          {label}
        </span>
        {note ? <span className="text-[11px] text-faint">{note}</span> : null}
      </span>
      <span className="flex items-baseline gap-2">
        <b className="tnum font-mono text-[22px] font-normal leading-none tracking-[-0.03em]">
          {value}
        </b>
        {suffix ? <span className="text-[11px] text-faint">{suffix}</span> : null}
      </span>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </label>
  );
}

/** A binary fact about the patient. Selected state is weight, not colour. */
export function ToggleChip({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChange(!active)}
      className={`border px-3 py-1.5 text-[12px] transition-colors ${
        active
          ? "border-ink font-medium text-ink"
          : "border-rule text-faint hover:text-soft"
      }`}
    >
      {label}
    </button>
  );
}

/** Mutually exclusive choice, drawn as an underline rather than a fill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex border-b border-rule">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`-mb-px border-b px-3.5 pb-2 pt-1 text-[12.5px] transition-colors ${
            option.value === value
              ? "border-ink text-ink"
              : "border-transparent text-faint hover:text-soft"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * A panel of results that either came back or did not.
 *
 * Grouped the way tests are ordered rather than the way a score lists
 * them, so one tap covers a whole panel. Until it is available every
 * item inside stays unmeasured — which is not the same as normal, and
 * is what keeps the completeness warning honest.
 */
export function ResultGroup({
  label,
  available,
  onAvailable,
  children,
}: {
  label: string;
  available: boolean;
  onAvailable: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        aria-pressed={available}
        onClick={() => onAvailable(!available)}
        className="flex items-center gap-2.5 self-start text-left"
      >
        <span
          className={`grid h-4 w-4 flex-none place-items-center border ${
            available ? "border-ink bg-ink" : "border-rule"
          }`}
        >
          {available ? (
            <svg viewBox="0 0 10 8" className="h-2 w-2.5" aria-hidden="true">
              <path
                d="M1 4.2 3.6 6.8 9 1.4"
                fill="none"
                stroke="var(--bg)"
                strokeWidth="1.8"
              />
            </svg>
          ) : null}
        </span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
            available ? "text-ink" : "text-faint"
          }`}
        >
          {label}
        </span>
        <span className="text-[11px] normal-case tracking-normal text-faint">
          {available ? "back" : "not available"}
        </span>
      </button>

      {available ? (
        <div className="flex flex-wrap gap-2">{children}</div>
      ) : null}
    </div>
  );
}
