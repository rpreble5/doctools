/**
 * Probability revision and the threshold model.
 *
 * The threshold model is the point of this module, not Bayes. A test
 * earns its place only when its result can move you across a line you
 * would act on. Most tests ordered cannot, and that is the lesson the
 * numbers are here to make visible.
 */

export type Probability = number; // 0..1

export interface LikelihoodRatios {
  positive: number;
  negative: number;
}

export interface Thresholds {
  /** Below this, do not test — you would not act on any result. */
  test: Probability;
  /** Above this, treat without further testing. */
  treat: Probability;
}

const clampProbability = (p: number): Probability =>
  Math.min(1 - 1e-9, Math.max(1e-9, p));

export const probabilityToOdds = (p: Probability): number => {
  const q = clampProbability(p);
  return q / (1 - q);
};

export const oddsToProbability = (odds: number): Probability =>
  odds / (1 + odds);

/** Derive likelihood ratios from sensitivity and specificity. */
export function likelihoodRatios(
  sensitivity: number,
  specificity: number,
): LikelihoodRatios {
  const sens = clampProbability(sensitivity);
  const spec = clampProbability(specificity);
  return {
    positive: sens / (1 - spec),
    negative: (1 - sens) / spec,
  };
}

/** Revise a probability by a single likelihood ratio. */
export function revise(pretest: Probability, lr: number): Probability {
  return oddsToProbability(probabilityToOdds(pretest) * lr);
}

/**
 * Revise through a sequence of results. Chaining assumes conditional
 * independence between tests, which is often generous — two tests
 * measuring the same thing will overstate their combined power.
 */
export function reviseSeries(pretest: Probability, lrs: number[]): Probability {
  return lrs.reduce<Probability>((p, lr) => revise(p, lr), pretest);
}

export type Zone = "below-test" | "test" | "treat";

export function zoneFor(p: Probability, t: Thresholds): Zone {
  if (p < t.test) return "below-test";
  if (p >= t.treat) return "treat";
  return "test";
}

/**
 * Whether a test can change management from where you currently stand.
 * Returns false when both possible results land in the same zone —
 * the case worth surfacing, because it is the common one.
 */
export function canChangeManagement(
  pretest: Probability,
  lr: LikelihoodRatios,
  t: Thresholds,
): boolean {
  const ifPositive = zoneFor(revise(pretest, lr.positive), t);
  const ifNegative = zoneFor(revise(pretest, lr.negative), t);
  return ifPositive !== ifNegative;
}

export const asPercent = (p: Probability, digits = 0): string =>
  `${(p * 100).toFixed(digits)}`;
