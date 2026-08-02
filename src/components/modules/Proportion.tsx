export interface ProportionMark {
  count: number;
  tone: "harm" | "benefit" | "scale" | "accent";
}

/**
 * A claim about proportions, drawn small enough to sit inside a
 * sentence's worth of space.
 *
 * "Misses about 2 in 10" is a sentence you skim. Two filled squares out
 * of ten is a thing you see. This is the icon-array idea at the scale a
 * caption can carry, for the many small claims that do not deserve a
 * hundred-square grid.
 */
export function Proportion({
  total,
  marks,
  label,
}: {
  total: number;
  marks: ProportionMark[];
  label?: string;
}) {
  const fill = {
    harm: "bg-harm",
    benefit: "bg-benefit",
    scale: "bg-scale",
    accent: "bg-accent",
  } as const;

  const cells: (ProportionMark["tone"] | null)[] = Array.from(
    { length: total },
    () => null,
  );
  let i = 0;
  for (const mark of marks) {
    for (let n = 0; n < mark.count && i < total; n += 1, i += 1) {
      cells[i] = mark.tone;
    }
  }

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span className="flex gap-[2px]" aria-hidden="true">
        {cells.map((tone, index) => (
          <span
            key={index}
            className={`block h-2 w-2 transition-colors duration-300 ${
              tone ? fill[tone] : "bg-sunk"
            }`}
          />
        ))}
      </span>
      {label ? (
        <span className="text-[11px] text-faint">{label}</span>
      ) : null}
    </span>
  );
}
