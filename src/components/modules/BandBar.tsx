export interface Band {
  /** Upper bound of this band, inclusive. */
  upTo: number;
  label: string;
}

/**
 * Where a score sits among its bands, drawn to scale.
 *
 * Bands are almost never equal widths, and the totals hide it. PSI's
 * class III is a twenty-point sliver between a seventy-point class II
 * and a forty-point class IV — so a patient one point past 70 has
 * crossed a boundary that a patient at 40 is nowhere near. A number
 * alone cannot show that; a bar drawn to scale shows it immediately.
 */
export function BandBar({
  value,
  bands,
  bypassed = false,
  bypassNote,
}: {
  value: number;
  bands: Band[];
  /** The score does not apply — an algorithm has already decided. */
  bypassed?: boolean;
  bypassNote?: string;
}) {
  const max = bands[bands.length - 1].upTo;
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;

  const activeIndex = bands.findIndex((b) => value <= b.upTo);
  const current = activeIndex === -1 ? bands.length - 1 : activeIndex;

  // Distance to the next boundary, which is the thing worth knowing.
  const boundary = bands[current].upTo;
  const toNext = boundary - value;
  const hasNext = current < bands.length - 1;

  return (
    <div className="flex flex-col gap-2">
      <div className={`relative ${bypassed ? "opacity-40" : ""}`}>
        {/* marker label */}
        {!bypassed ? (
          <div className="relative mb-1 h-4">
            <span
              className="tnum absolute -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-ink"
              style={{ left: pct(value) }}
            >
              {value}
            </span>
          </div>
        ) : (
          <div className="mb-1 h-4" />
        )}

        {/* bands */}
        <div className="relative flex h-5 w-full overflow-hidden">
          {bands.map((band, i) => {
            const from = i === 0 ? 0 : bands[i - 1].upTo;
            const width = ((band.upTo - from) / max) * 100;
            // Sequential ramp from one hue — a data mark, so colour is allowed.
            const shade = ["bg-scale/20", "bg-scale/35", "bg-scale/55", "bg-scale/75"][
              Math.min(i, 3)
            ];
            return (
              <div
                key={band.label}
                className={`relative ${shade} ${
                  !bypassed && i === current ? "" : "opacity-60"
                }`}
                style={{ width: `${width}%` }}
              >
                <span
                  className={`absolute inset-0 grid place-items-center text-[10px] font-semibold tracking-[0.08em] ${
                    !bypassed && i === current ? "text-ink" : "text-faint"
                  }`}
                >
                  {band.label}
                </span>
              </div>
            );
          })}

          {/* current position */}
          {!bypassed ? (
            <div
              className="absolute inset-y-0 w-0.5 bg-ink"
              style={{ left: pct(value) }}
            />
          ) : null}
        </div>

        {/* boundaries */}
        <div className="relative mt-1 h-4">
          {bands.slice(0, -1).map((band) => (
            <span
              key={band.upTo}
              className="tnum absolute -translate-x-1/2 font-mono text-[10px] text-faint"
              style={{ left: pct(band.upTo) }}
            >
              {band.upTo}
            </span>
          ))}
        </div>
      </div>

      <p className="m-0 text-[11.5px] text-faint">
        {bypassed
          ? bypassNote
          : hasNext
            ? `${toNext} ${toNext === 1 ? "point" : "points"} from class ${bands[current + 1].label}`
            : "Top band"}
      </p>
    </div>
  );
}
