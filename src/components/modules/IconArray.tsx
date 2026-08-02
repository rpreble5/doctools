/**
 * One hundred people, colored by what happens to them.
 *
 * Clinicians correctly estimate treatment harms about 13% of the time
 * and benefits about 11% — underestimating harm and overestimating
 * benefit in a consistent direction. Counting squares is harder to get
 * wrong than reading a relative risk.
 */
export function IconArray({
  harm = 0,
  benefit = 0,
  total = 100,
  columns = 25,
}: {
  harm?: number;
  benefit?: number;
  total?: number;
  columns?: number;
}) {
  const cells = Array.from({ length: total }, (_, i) => {
    if (i < harm) return "harm" as const;
    if (i < harm + benefit) return "benefit" as const;
    return "none" as const;
  });

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {cells.map((kind, i) => (
        <span
          key={i}
          className={`block aspect-square transition-colors duration-200 ${
            kind === "harm"
              ? "bg-harm"
              : kind === "benefit"
                ? "bg-benefit"
                : "bg-sunk"
          }`}
        />
      ))}
    </div>
  );
}

export function IconArrayKey({
  harmLabel,
  benefitLabel,
}: {
  harmLabel: string;
  benefitLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-6 text-[11.5px] text-faint">
      <span className="flex items-center gap-[7px]">
        <i className="block h-2 w-2 bg-harm" />
        {harmLabel}
      </span>
      <span className="flex items-center gap-[7px]">
        <i className="block h-2 w-2 bg-benefit" />
        {benefitLabel}
      </span>
    </div>
  );
}
