import type { Probability, Thresholds } from "@/lib/probability";
import { asPercent } from "@/lib/probability";

/**
 * Probability revision drawn against the two thresholds that decide
 * whether a test was worth doing.
 *
 * Presentation is the active ingredient here, not decoration: clinicians
 * interpret test results correctly about 8% of the time when given
 * sensitivity and specificity, 34% with likelihood ratios, and 73% with
 * a graphic. So the picture leads and the arithmetic hides.
 */
export function ProbabilityBand({
  pretest,
  posttest,
  thresholds,
  evidenceRange,
  label = "now",
}: {
  pretest: Probability;
  posttest: Probability;
  thresholds: Thresholds;
  /** Published range for the post-test value, drawn as a band. */
  evidenceRange?: [Probability, Probability];
  label?: string;
}) {
  const pct = (p: number) => `${p * 100}%`;
  const lo = Math.min(pretest, posttest);
  const span = Math.abs(posttest - pretest);

  return (
    <div className="relative pt-6">
      {/* movement from pretest to posttest */}
      {span > 0.001 ? (
        <div
          className="absolute top-2 h-2.5 border-l border-r border-faint"
          style={{ left: pct(lo), width: pct(span) }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-faint" />
          <span className="tnum absolute right-0 top-[-15px] translate-x-1/2 text-[10.5px] text-soft">
            {posttest > pretest ? "+" : "−"}
            {asPercent(span)}
          </span>
        </div>
      ) : null}

      {/* rail */}
      <div className="relative h-[26px] bg-sunk">
        <div
          className="absolute inset-y-0 bg-scale/20"
          style={{
            left: pct(thresholds.test),
            width: pct(thresholds.treat - thresholds.test),
          }}
        />
        <div
          className="absolute inset-y-0 bg-benefit/25"
          style={{
            left: pct(thresholds.treat),
            width: pct(1 - thresholds.treat),
          }}
        />
        {evidenceRange ? (
          <div
            className="absolute inset-y-0 bg-accent/25"
            style={{
              left: pct(evidenceRange[0]),
              width: pct(evidenceRange[1] - evidenceRange[0]),
            }}
          />
        ) : null}

        <div
          className="absolute -inset-y-1.5 w-px bg-faint"
          style={{ left: pct(pretest) }}
        />
        <div
          className="absolute -inset-y-2 w-0.5 bg-accent"
          style={{ left: pct(posttest) }}
        />
      </div>

      {/* point labels */}
      <div className="relative h-4">
        <span
          className="tnum absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10.5px] text-faint"
          style={{ left: pct(pretest) }}
        >
          pretest {asPercent(pretest)}
        </span>
        <span
          className="tnum absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10.5px] text-ink"
          style={{ left: pct(posttest) }}
        >
          {label} {asPercent(posttest)}
        </span>
      </div>

      {/* threshold axis */}
      <div className="relative mt-3 h-4">
        <span className="absolute left-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          0
        </span>
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-faint"
          style={{ left: pct(thresholds.test) }}
        >
          test
        </span>
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-faint"
          style={{ left: pct(thresholds.treat) }}
        >
          treat
        </span>
        <span className="absolute right-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          100
        </span>
      </div>
    </div>
  );
}
