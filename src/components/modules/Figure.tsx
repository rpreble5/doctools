import type { ReactNode } from "react";

/**
 * A single quantity with its caption. Large and light rather than
 * medium and semibold — weight comes from the scale relationship and
 * the air around it, not from ink.
 */
export function Figure({
  value,
  unit,
  caption,
  label,
  size = "panel",
  tone = "ink",
}: {
  value: ReactNode;
  unit?: string;
  caption?: ReactNode;
  /**
   * Small qualifier above the figure, for values that are ambiguous
   * alone — a roman numeral at display size reads as strokes, not a
   * number, until something names it.
   */
  label?: string;
  size?: "panel" | "focal";
  tone?: "ink" | "accent";
}) {
  const scale = size === "focal" ? "text-[60px]" : "text-[44px]";

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
          {label}
        </span>
      ) : null}
      <p
        className={`tnum m-0 flex items-baseline gap-2 font-light leading-[0.85] tracking-[-0.045em] ${scale} ${
          tone === "accent" ? "text-accent" : "text-ink"
        }`}
      >
        {value}
        {unit ? (
          <span className="text-[0.24em] font-normal tracking-normal text-faint">
            {unit}
          </span>
        ) : null}
      </p>
      {caption ? (
        <p className="m-0 text-[12.5px] text-soft">{caption}</p>
      ) : null}
    </div>
  );
}
