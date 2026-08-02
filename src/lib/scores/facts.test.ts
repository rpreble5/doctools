import { describe, expect, it } from "vitest";
import {
  CASE_FACTS,
  emptyCase,
  isFactLive,
  toDrip,
  toPsi,
  toSevereCap,
  type CaseFact,
} from "@/tools/cap/facts";
import { drip } from "./drip";
import { psi } from "./psi";
import { severeCap } from "./severeCap";

const factFor = (key: string): CaseFact =>
  CASE_FACTS.find((f) => f.key === key)!;

describe("the case feeds both scores", () => {
  it("declares a point value that matches what each score awards", () => {
    for (const fact of CASE_FACTS) {
      const base = emptyCase();
      const withFact = { ...base, [fact.key]: true };

      if (fact.psi !== undefined) {
        const delta = psi(toPsi(withFact)).points - psi(toPsi(base)).points;
        expect(delta, `${fact.key} PSI`).toBe(fact.psi);
      } else {
        // A fact PSI does not use must not move it.
        expect(
          psi(toPsi(withFact)).points - psi(toPsi(base)).points,
          `${fact.key} should not move PSI`,
        ).toBe(0);
      }

      if (fact.drip !== undefined) {
        const delta = drip(toDrip(withFact)).points - drip(toDrip(base)).points;
        expect(delta, `${fact.key} DRIP`).toBe(fact.drip);
      } else {
        expect(
          drip(toDrip(withFact)).points - drip(toDrip(base)).points,
          `${fact.key} should not move DRIP`,
        ).toBe(0);
      }
    }
  });

  it("declares a severe-CAP criterion only where one is actually counted", () => {
    for (const fact of CASE_FACTS) {
      const base = emptyCase();
      const withFact = { ...base, [fact.key]: true };
      const before = severeCap(toSevereCap(base));
      const after = severeCap(toSevereCap(withFact));

      if (fact.severe === "major") {
        expect(after.majorCount - before.majorCount, fact.key).toBe(1);
      } else if (fact.severe === "minor") {
        expect(after.minorCount - before.minorCount, fact.key).toBe(1);
      } else if (fact.key === "uraemia") {
        // The one documented exception: PSI scores BUN at 30, severe CAP
        // at 20, and thirty is twenty. Asserted on its own below.
        expect(after.minorCount - before.minorCount).toBe(1);
      } else {
        expect(
          after.majorCount + after.minorCount,
          `${fact.key} should not move severe CAP`,
        ).toBe(before.majorCount + before.minorCount);
      }
    }
  });

  it("lets BUN over 30 satisfy the severe-CAP threshold of 20", () => {
    const base = emptyCase();
    // PSI's row alone, without touching the severe-CAP row.
    const withPsiBun = { ...base, uraemia: true };
    expect(toSevereCap(withPsiBun).uraemiaOver20).toBe(true);
    expect(severeCap(toSevereCap(withPsiBun)).minorCount).toBe(1);
  });

  it("does not let PSI's temperature fact imply hypothermia", () => {
    // PSI's fact is "under 35 or 40 and over" — the high limb does not
    // mean the patient is cold.
    const base = emptyCase();
    const withPsiTemp = { ...base, temperatureExtreme: true };
    expect(toSevereCap(withPsiTemp).hypothermiaUnder36).toBe(false);
  });

  it("shares exactly one fact between the two scores", () => {
    const shared = CASE_FACTS.filter(
      (f) => f.psi !== undefined && f.drip !== undefined,
    );
    expect(shared.map((f) => f.key)).toEqual(["longTermCare"]);
  });

  it("moves both scores from the one shared fact", () => {
    const base = emptyCase();
    const withIt = { ...base, longTermCare: true };
    expect(psi(toPsi(withIt)).points - psi(toPsi(base)).points).toBe(10);
    expect(drip(toDrip(withIt)).points).toBe(2);
  });
});

describe("isFactLive", () => {
  const psiOnly = factFor("pleuralEffusion");
  const dripOnly = factFor("woundCare");
  const shared = factFor("longTermCare");
  const gate = factFor("heartFailure");

  it("filters by focus", () => {
    expect(isFactLive(dripOnly, { focus: "psi", psiInClassOne: false })).toBe(false);
    expect(isFactLive(psiOnly, { focus: "drip", psiInClassOne: false })).toBe(false);
    expect(isFactLive(shared, { focus: "psi", psiInClassOne: false })).toBe(true);
    expect(isFactLive(shared, { focus: "drip", psiInClassOne: false })).toBe(true);
  });

  it("shows everything when focus is both", () => {
    for (const fact of CASE_FACTS) {
      expect(isFactLive(fact, { focus: "all", psiInClassOne: false })).toBe(true);
    }
  });

  it("dims PSI-only non-gate facts in class I", () => {
    expect(isFactLive(psiOnly, { focus: "all", psiInClassOne: true })).toBe(false);
  });

  it("keeps gate facts live in class I — they are what breaks it", () => {
    expect(isFactLive(gate, { focus: "all", psiInClassOne: true })).toBe(true);
  });

  it("keeps DRIP facts live in class I — DRIP is still counting", () => {
    expect(isFactLive(dripOnly, { focus: "all", psiInClassOne: true })).toBe(true);
    expect(isFactLive(shared, { focus: "all", psiInClassOne: true })).toBe(true);
  });
});
