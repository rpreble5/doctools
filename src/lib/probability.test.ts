import { describe, expect, it } from "vitest";
import {
  canChangeManagement,
  likelihoodRatios,
  oddsToProbability,
  probabilityToOdds,
  revise,
  reviseSeries,
  zoneFor,
} from "./probability";

describe("odds and probability", () => {
  it("round-trips", () => {
    for (const p of [0.01, 0.2, 0.5, 0.83, 0.99]) {
      expect(oddsToProbability(probabilityToOdds(p))).toBeCloseTo(p, 10);
    }
  });

  it("puts even odds at one half", () => {
    expect(probabilityToOdds(0.5)).toBeCloseTo(1, 10);
  });
});

describe("likelihoodRatios", () => {
  it("derives LRs from sensitivity and specificity", () => {
    // Worked example: sens 0.90, spec 0.80 → LR+ 4.5, LR− 0.125
    const lr = likelihoodRatios(0.9, 0.8);
    expect(lr.positive).toBeCloseTo(4.5, 6);
    expect(lr.negative).toBeCloseTo(0.125, 6);
  });

  it("gives a useless test an LR of 1 in both directions", () => {
    const lr = likelihoodRatios(0.5, 0.5);
    expect(lr.positive).toBeCloseTo(1, 6);
    expect(lr.negative).toBeCloseTo(1, 6);
  });
});

describe("revise", () => {
  it("matches a hand-worked Bayes calculation", () => {
    // 20% pretest → odds 0.25; × LR+ 4.5 → odds 1.125 → 52.9%
    expect(revise(0.2, 4.5)).toBeCloseTo(0.529411, 5);
  });

  it("leaves probability untouched when LR is 1", () => {
    expect(revise(0.37, 1)).toBeCloseTo(0.37, 10);
  });

  it("moves down on a negative likelihood ratio", () => {
    expect(revise(0.5, 0.125)).toBeCloseTo(0.111111, 5);
  });

  it("chains multiplicatively", () => {
    expect(reviseSeries(0.2, [4.5, 2])).toBeCloseTo(revise(revise(0.2, 4.5), 2), 10);
  });
});

describe("threshold model", () => {
  const thresholds = { test: 0.12, treat: 0.7 };

  it("classifies zones at the boundaries", () => {
    expect(zoneFor(0.05, thresholds)).toBe("below-test");
    expect(zoneFor(0.12, thresholds)).toBe("test");
    expect(zoneFor(0.5, thresholds)).toBe("test");
    expect(zoneFor(0.7, thresholds)).toBe("treat");
    expect(zoneFor(0.95, thresholds)).toBe("treat");
  });

  it("flags a test that cannot change management", () => {
    // Already deep in the treat zone; a weak test moves nothing across a line.
    const weak = likelihoodRatios(0.6, 0.6);
    expect(canChangeManagement(0.95, weak, thresholds)).toBe(false);
  });

  it("recognizes a test that can change management", () => {
    const strong = likelihoodRatios(0.95, 0.95);
    expect(canChangeManagement(0.3, strong, thresholds)).toBe(true);
  });
});
