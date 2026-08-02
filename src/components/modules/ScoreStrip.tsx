"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Briefly true after a value changes.
 *
 * The strip sits above the inputs, so your eye is on the toggle you
 * just clicked, not on the number. A short emphasis on whichever score
 * moved is what carries the change across the gap.
 */
function useFlash(value: unknown, ms = 700): boolean {
  const [flashing, setFlashing] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setFlashing(true);
    const timer = setTimeout(() => setFlashing(false), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return flashing;
}

export interface ScoreStripProps {
  label: string;
  /** The answer, large. */
  value: ReactNode;
  /** Sits beside the value — points, units, a count. */
  detail?: string;
  /** One line on what it means. */
  verdict?: string;
  /** 0..1 along the scale. */
  progress: number;
  /** Fractions of the scale where bands change. Drawn as faint ticks. */
  thresholds?: number[];
  /** Draw the line as discrete blocks instead — for counts out of a few. */
  segments?: number;
  /** How many segments are filled. Required when segments is set. */
  filled?: number;
  /** The line does not apply: an algorithm decided before it was reached. */
  bypassed?: boolean;
  /** Watched for change, to drive the emphasis. */
  flashOn?: unknown;
}

export function ScoreStrip({
  label,
  value,
  detail,
  verdict,
  progress,
  thresholds = [],
  segments,
  filled = 0,
  bypassed = false,
  flashOn,
}: ScoreStripProps) {
  const flashing = useFlash(flashOn ?? progress);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
        {label}
      </span>

      <div className="flex items-baseline gap-2.5">
        <span
          className={`tnum text-[30px] font-light leading-none tracking-[-0.04em] transition-colors duration-200 ${
            flashing ? "text-accent" : "text-ink"
          }`}
        >
          {value}
        </span>
        {detail ? (
          <span className="tnum font-mono text-[12px] text-soft">{detail}</span>
        ) : null}
      </div>

      {/* the line */}
      {segments ? (
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 transition-colors duration-[250ms] ${
                i < filled ? "bg-scale" : "bg-sunk"
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="relative h-[3px] w-full bg-sunk" aria-hidden="true">
          {/*
            Always rendered, width zero when bypassed. Unmounting it meant
            the fill reappeared already at its final width, so crossing
            out of class I jumped instead of growing — there was no
            starting value to animate from.
          */}
          <div
            className="absolute inset-y-0 left-0 bg-scale transition-[width] duration-[250ms] ease-out"
            style={{ width: bypassed ? "0%" : `${Math.min(100, progress * 100)}%` }}
          />
          {thresholds.map((t) => (
            <span
              key={t}
              className="absolute -top-1 h-[11px] w-px bg-rule"
              style={{ left: `${t * 100}%` }}
            />
          ))}
        </div>
      )}

      {verdict ? (
        <span className="text-[11.5px] leading-snug text-soft">{verdict}</span>
      ) : null}
    </div>
  );
}
