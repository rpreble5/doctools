export interface CompareBar {
  label: string;
  /** 0..1 */
  value: number;
  display: string;
  tone: "benefit" | "harm" | "scale";
}

/** Proportions set side by side, usually guideline against practice. */
export function CompareBars({ bars }: { bars: CompareBar[] }) {
  const fill = {
    benefit: "bg-benefit",
    harm: "bg-harm",
    scale: "bg-scale",
  } as const;

  return (
    <div className="flex flex-col gap-4">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="grid grid-cols-[112px_1fr_38px] items-center gap-3.5"
        >
          <span className="text-[12.5px] text-soft">{bar.label}</span>
          <i className="block h-3.5 bg-sunk">
            <b
              className={`block h-full ${fill[bar.tone]}`}
              style={{ width: `${bar.value * 100}%` }}
            />
          </i>
          <em className="tnum text-right text-[12px] not-italic text-soft">
            {bar.display}
          </em>
        </div>
      ))}
    </div>
  );
}
