import { describe, expect, it } from "vitest";
import {
  CASE_FACTS,
  CASE_LEVELS,
  emptyCase,
  isFactLive,
  toDrip,
  toPsi,
  toSevereCap,
  type CaseFact,
  type CaseState,
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
      } else {
        expect(
          after.majorCount + after.minorCount,
          `${fact.key} should not move severe CAP`,
        ).toBe(before.majorCount + before.minorCount);
      }
    }
  });

  it("reads one BUN level into both scores at their own cut points", () => {
    const base = emptyCase();

    const normal = { ...base, bun: "under20" as const };
    expect(toPsi(normal).uremia).toBe(false);
    expect(toSevereCap(normal).uremiaOver20).toBe(false);

    // Twenty counts for severe CAP and not for PSI.
    const twenty = { ...base, bun: "over20" as const };
    expect(toPsi(twenty).uremia).toBe(false);
    expect(toSevereCap(twenty).uremiaOver20).toBe(true);
    expect(psi(toPsi(twenty)).points).toBe(psi(toPsi(normal)).points);

    // Thirty counts for both, because thirty is also twenty.
    const thirty = { ...base, bun: "over30" as const };
    expect(toPsi(thirty).uremia).toBe(true);
    expect(toSevereCap(thirty).uremiaOver20).toBe(true);
    expect(psi(toPsi(thirty)).points - psi(toPsi(normal)).points).toBe(20);
  });

  it("reads one temperature level into both scores, including the high limb", () => {
    const base = emptyCase();
    const at = (temperature: CaseState["temperature"]) => ({ ...base, temperature });

    // Cold enough for both.
    expect(toPsi(at("under35")).temperatureExtreme).toBe(true);
    expect(toSevereCap(at("under35")).hypothermiaUnder36).toBe(true);

    // The band between: severe CAP only.
    expect(toPsi(at("band35to36")).temperatureExtreme).toBe(false);
    expect(toSevereCap(at("band35to36")).hypothermiaUnder36).toBe(true);

    // Normal: neither.
    expect(toPsi(at("normal")).temperatureExtreme).toBe(false);
    expect(toSevereCap(at("normal")).hypothermiaUnder36).toBe(false);

    // Hot: PSI only. A febrile patient is not hypothermic — the trap
    // the old disjunction made easy to fall into.
    expect(toPsi(at("over40")).temperatureExtreme).toBe(true);
    expect(toSevereCap(at("over40")).hypothermiaUnder36).toBe(false);
  });

  it("declares the same points on the level options as the scores award", () => {
    for (const level of CASE_LEVELS) {
      for (const option of level.options) {
        const base = emptyCase();
        const withIt = { ...base, [level.key]: option.value } as CaseState;

        const psiDelta = psi(toPsi(withIt)).points - psi(toPsi(base)).points;
        expect(psiDelta, `${level.key}/${option.value} PSI`).toBe(option.psi ?? 0);

        const before = severeCap(toSevereCap(base));
        const after = severeCap(toSevereCap(withIt));
        const minorDelta = after.minorCount - before.minorCount;
        expect(minorDelta, `${level.key}/${option.value} severe`).toBe(
          option.severe === "minor" ? 1 : 0,
        );
      }
    }
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
