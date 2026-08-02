import { describe, expect, it } from "vitest";
import {
  drip,
  DRIP_MAJOR,
  DRIP_MAX,
  DRIP_MINOR,
  DRIP_THRESHOLD,
  type DripFindings,
} from "./drip";

const none: DripFindings = {
  antibioticsWithin60Days: false,
  tubeFeeding: false,
  longTermCare: false,
  priorDrugResistantInfection: false,
  chronicPulmonaryDisease: false,
  hospitalizedWithin60Days: false,
  poorFunctionalStatus: false,
  mrsaColonization: false,
  woundCare: false,
  gastricAcidSuppression: false,
};

const all: DripFindings = {
  antibioticsWithin60Days: true,
  tubeFeeding: true,
  longTermCare: true,
  priorDrugResistantInfection: true,
  chronicPulmonaryDisease: true,
  hospitalizedWithin60Days: true,
  poorFunctionalStatus: true,
  mrsaColonization: true,
  woundCare: true,
  gastricAcidSuppression: true,
};

describe("drip", () => {
  it("scores nothing for a patient with no risk factors", () => {
    const r = drip(none);
    expect(r.points).toBe(0);
    expect(r.highRisk).toBe(false);
    expect(r.contributions).toEqual([]);
  });

  it("gives every major factor two points", () => {
    for (const item of DRIP_MAJOR) {
      expect(drip({ ...none, [item.key]: true }).points).toBe(2);
    }
  });

  it("gives every minor factor one point", () => {
    for (const item of DRIP_MINOR) {
      expect(drip({ ...none, [item.key]: true }).points).toBe(1);
    }
  });

  it("tops out at fourteen — four majors and six minors", () => {
    expect(drip(all).points).toBe(DRIP_MAX);
    expect(DRIP_MAJOR.length * 2 + DRIP_MINOR.length).toBe(DRIP_MAX);
  });

  it("crosses at four, not three", () => {
    // Two majors reach the threshold exactly.
    const twoMajors = drip({
      ...none,
      antibioticsWithin60Days: true,
      tubeFeeding: true,
    });
    expect(twoMajors.points).toBe(4);
    expect(twoMajors.highRisk).toBe(true);

    // One major and one minor fall short.
    const short = drip({
      ...none,
      antibioticsWithin60Days: true,
      woundCare: true,
    });
    expect(short.points).toBe(3);
    expect(short.highRisk).toBe(false);
  });

  it("reaches the threshold on minor factors alone", () => {
    const fourMinors = drip({
      ...none,
      chronicPulmonaryDisease: true,
      hospitalizedWithin60Days: true,
      poorFunctionalStatus: true,
      woundCare: true,
    });
    expect(fourMinors.points).toBe(4);
    expect(fourMinors.highRisk).toBe(true);
  });

  it("reports the distance to the threshold in both directions", () => {
    expect(drip(none).distanceToThreshold).toBe(DRIP_THRESHOLD);
    expect(drip({ ...none, woundCare: true }).distanceToThreshold).toBe(3);
    expect(drip(all).distanceToThreshold).toBe(DRIP_THRESHOLD - DRIP_MAX);
  });

  it("lists what is contributing", () => {
    const r = drip({ ...none, tubeFeeding: true, mrsaColonization: true });
    expect(r.points).toBe(3);
    expect(r.contributions).toEqual([
      { label: "Tube feeding", points: 2 },
      { label: "MRSA colonization, 1 y", points: 1 },
    ]);
  });
});
