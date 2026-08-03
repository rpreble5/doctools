"use client";

import type { ReactNode } from "react";

/**
 * The scoring factors, where toggling them happens.
 *
 * Input and breakdown are the same list. Showing a set of controls and
 * then a separate chart of what those controls produced is duplication
 * dressed up as explanation — the row that carries the points is the
 * row you click.
 *
 * ROW_STATE — a row has two facts to tell, so it gets two channels:
 *
 *   indent  did the clinician say yes? An active row pulls flush left,
 *           onto the same axis as the group heading; an inactive one
 *           sits 14px in. Costs no ink and survives without colour.
 *   band    is it counting toward the score right now? --band, with
 *           its left edge drawn in --rule so the tint reads as a
 *           decision rather than a wash.
 *
 * Both are neutral chrome, so no data colour is spent here. The pair
 * is what lets `inert` be stated rather than implied: a real finding
 * that is not currently counting is indented and unbanded, which is
 * the literal definition. Rows are adjacent with no gap so that a run
 * of active ones merges into a single block — that is the property
 * that lets you see how much of a group is marked without reading it.
 */
export interface FactorContribution {
  /** Which score this feeds. Omitted when there is only one in play. */
  score?: string;
  points: number;
}

export function Factor({
  label,
  points,
  contributions,
  active,
  onToggle,
  disabled = false,
  inert = false,
}: {
  label: string;
  /** Shorthand for a single unnamed contribution. */
  points?: number;
  /**
   * What this fact is worth, per score. Named when more than one score
   * is on screen, so a row can say which question it answers without a
   * legend.
   */
  contributions?: FactorContribution[];
  active: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
  /**
   * Cannot affect the result as things stand — still clickable, but
   * shown recessed with a dash instead of points. Answers "which of
   * these actually matter right now" without anyone having to ask.
   */
  inert?: boolean;
}) {
  const parts: FactorContribution[] =
    contributions ?? (points === undefined ? [] : [{ points }]);
  /* Two facts, two channels — see ROW_STATE below. */
  const banded = active && !inert;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onToggle(!active)}
      className={`group -mx-2.5 flex w-full items-baseline justify-between gap-3 border-l py-2 pr-2.5 text-left transition-[padding,background-color,border-color,color] duration-150 ${
        active ? "pl-2.5" : "pl-6"
      } ${banded ? "border-l-rule bg-band" : "border-l-transparent"} ${
        disabled
          ? "cursor-default opacity-40"
          : inert
            ? active
              ? "text-soft"
              : "text-faint/45 hover:text-soft"
            : active
              ? "text-ink"
              : "text-faint hover:text-soft"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[12.5px]">{label}</span>
      </span>
      {/* An inert factor shows a dash even when present — the finding is
          real, it just is not counting toward the current result. */}
      <span
        className={`flex flex-none items-baseline gap-2 ${
          inert ? "text-faint/40" : active ? "text-ink" : "text-faint/70"
        }`}
      >
        {inert ? (
          <span className="tnum font-mono text-[12px]">—</span>
        ) : (
          parts.map((part) => (
            <span key={part.score ?? "only"} className="flex items-baseline gap-1">
              {part.score ? (
                <span className="text-[9px] font-semibold uppercase tracking-[0.09em] opacity-70">
                  {part.score}
                </span>
              ) : null}
              <span className="tnum font-mono text-[12px]">
                {active ? part.points : `+${part.points}`}
              </span>
            </span>
          ))
        )}
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
      {/* No gap between rows: the bands of adjacent active rows have to
          meet, or a run reads as separate marks instead of one block.
          The rhythm lives in the rows' own padding instead. */}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export interface LevelChoice {
  value: string;
  label: string;
  contributions?: FactorContribution[];
}

/**
 * One measurement, several bands.
 *
 * A variable read by two scores at different cut points cannot honestly
 * be two checkboxes — they can disagree with the arithmetic, and with
 * each other. Stating the measurement once and letting each score take
 * what it needs removes the contradiction rather than papering over it.
 */
export function FactorLevels({
  label,
  options,
  value,
  onChange,
  inert = false,
}: {
  label: string;
  options: LevelChoice[];
  value: string;
  onChange: (next: string) => void;
  inert?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  const parts = selected?.contributions ?? [];
  /* Same two channels as Factor: a chosen band is asserted, and it is
     counting unless the current focus has made it inert. */
  const asserted = parts.length > 0;
  const banded = asserted && !inert;

  return (
    <div
      className={`-mx-2.5 flex flex-col gap-1.5 border-l py-2 pr-2.5 transition-[padding,background-color,border-color] duration-150 ${
        asserted ? "pl-2.5" : "pl-6"
      } ${banded ? "border-l-rule bg-band" : "border-l-transparent"} ${
        inert ? "opacity-45" : ""
      }`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            className={`truncate text-[12.5px] ${
              asserted ? "text-ink" : "text-faint"
            }`}
          >
            {label}
          </span>
        </span>

        <span className="flex flex-none items-baseline gap-2">
          {parts.length ? (
            parts.map((part) => (
              <span key={part.score ?? "only"} className="flex items-baseline gap-1">
                {part.score ? (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-ink opacity-70">
                    {part.score}
                  </span>
                ) : null}
                <span className="tnum font-mono text-[12px] text-ink">
                  {part.points ? part.points : "\u2713"}
                </span>
              </span>
            ))
          ) : (
            <span className="tnum font-mono text-[12px] text-faint/60">0</span>
          )}
        </span>
      </span>

      <span className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`flex-1 border px-1 py-[3px] text-[10.5px] transition-colors ${
              option.value === value
                ? "border-ink text-ink"
                : "border-hair text-faint hover:text-soft"
            }`}
          >
            {option.label}
          </button>
        ))}
      </span>
    </div>
  );
}
