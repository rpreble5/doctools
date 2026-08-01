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
