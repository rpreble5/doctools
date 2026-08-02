export interface Band {
  /** Upper bound of this band, inclusive. */
  upTo: number;
  label: string;
}

/**
 * A score drawn as a line that grows, with its class thresholds fixed
 * above it.
 *
 * The thresholds are furniture: PSI's boundaries are published cut
 * points and never move. Only the line does. Keeping the scale static
 * while the fill animates is what makes a change legible — you see the
 * line reach a boundary rather than reading two numbers and inferring
 * that it did.
 *
 * Drawn to scale, because the bands are nothing like equal. Class II
 * spans seventy points and class III spans twenty, so a patient at 68
 * is two points from changing class while a patient at 40 is nowhere
 * near. A total cannot show that.
 */
export function BandBar({
  value,
  bands,
  bypassed = false,
  bypassNote,
  bandNoun = "class",
}: {
  value: number;
  bands: Band[];
  /** What the bands are called. PSI has classes; DRIP just has two sides. */
  bandNoun?: string;
  /** The score does not apply — an algorithm has already decided. */
  bypassed?: boolean;
  bypassNote?: string;
}) {
  const max = bands[bands.length - 1].upTo;
  const clamped = Math.min(value, max);
  const pct = (n: number) => `${(n / max) * 100}%`;

  const activeIndex = bands.findIndex((b) => value <= b.upTo);
  const current = activeIndex === -1 ? bands.length - 1 : activeIndex;
  const hasNext = current < bands.length - 1;
  /*
   * Distance to where the next band *starts*, not to where this one
   * ends. Bands are inclusive upper bounds, so class III topping out at
   * 90 means class IV begins at 91 — a patient at 75 is sixteen points
   * away, not fifteen.
   */
  const toNext = bands[current].upTo + 1 - value;

  const boundaries = bands.slice(0, -1);

  return (
    <div className={`flex flex-col ${bypassed ? "opacity-40" : ""}`}>
      {/* class letters, centred over their span */}
      <div className="relative h-4">
        {bands.map((band, i) => {
          const from = i === 0 ? 0 : bands[i - 1].upTo;
          return (
            <span
              key={band.label}
              className={`absolute -translate-x-1/2 text-[10px] font-semibold tracking-[0.12em] ${
                !bypassed && i === current ? "text-ink" : "text-faint"
              }`}
              style={{ left: pct((from + band.upTo) / 2) }}
            >
              {band.label}
            </span>
          );
        })}
      </div>

      {/* boundary values */}
      <div className="relative h-3.5">
        {boundaries.map((band) => (
          <span
            key={band.upTo}
            className="tnum absolute -translate-x-1/2 font-mono text-[9.5px] text-faint"
            style={{ left: pct(band.upTo) }}
          >
            {band.upTo}
          </span>
        ))}
      </div>

      {/* ticks down to the line */}
      <div className="relative h-1.5">
        {boundaries.map((band) => (
          <span
            key={band.upTo}
            className="absolute bottom-0 top-0 w-px bg-rule"
            style={{ left: pct(band.upTo) }}
          />
        ))}
      </div>

      {/* the line */}
      <div className="relative h-[3px] w-full bg-sunk">
        {!bypassed ? (
          <div
            className="absolute inset-y-0 left-0 bg-scale transition-[width] duration-500 ease-out"
            style={{ width: pct(clamped) }}
          />
        ) : null}
      </div>

      {/* the score, riding the end of the line */}
      <div className="relative h-5">
        {!bypassed ? (
          <span
            className="tnum absolute top-1 -translate-x-1/2 font-mono text-[11px] text-ink transition-[left] duration-500 ease-out"
            style={{ left: pct(clamped) }}
          >
            {value}
          </span>
        ) : null}
      </div>

      <p className="m-0 text-[11.5px] text-faint">
        {bypassed
          ? bypassNote
          : hasNext
            ? `${toNext} ${toNext === 1 ? "point" : "points"} from ${bandNoun ? `${bandNoun} ` : ""}${bands[current + 1].label}`
            : "Top band"}
      </p>
    </div>
  );
}
