import { describe, expect, it } from "vitest";
import {
  MINOR_THRESHOLD,
  SEVERE_CAP_MAJOR,
  SEVERE_CAP_MINOR,
  severeCap,
  steroidGuidance,
  type SevereCapFindings,
} from "./severeCap";

const none: SevereCapFindings = {
  septicShock: false,
  mechanicalVentilation: false,
  tachypnoea: false,
  pafiUnder250: false,
  multilobarInfiltrates: false,
  confusion: false,
  uraemiaOver20: false,
  leukopenia: false,
  thrombocytopenia: false,
  hypothermiaUnder36: false,
  hypotensionNeedingFluids: false,
};

describe("severeCap", () => {
  it("is not severe with nothing present", () => {
    const r = severeCap(none);
    expect(r.severe).toBe(false);
    expect(r.metBy).toBe(null);
    expect(r.minorShortfall).toBe(MINOR_THRESHOLD);
  });

  it("is severe on any single major criterion", () => {
    for (const item of SEVERE_CAP_MAJOR) {
      const r = severeCap({ ...none, [item.key]: true });
      expect(r.severe, item.key).toBe(true);
      expect(r.metBy).toBe("major");
    }
  });

  it("is not severe on one or two minor criteria", () => {
    const one = severeCap({ ...none, tachypnoea: true });
    expect(one.severe).toBe(false);
    expect(one.minorShortfall).toBe(2);

    const two = severeCap({ ...none, tachypnoea: true, confusion: true });
    expect(two.severe).toBe(false);
    expect(two.minorShortfall).toBe(1);
  });

  it("is severe on exactly three minor criteria", () => {
    const r = severeCap({
      ...none,
      tachypnoea: true,
      confusion: true,
      uraemiaOver20: true,
    });
    expect(r.severe).toBe(true);
    expect(r.metBy).toBe("minor");
    expect(r.minorCount).toBe(3);
    expect(r.minorShortfall).toBe(0);
  });

  it("counts every minor criterion", () => {
    const all = SEVERE_CAP_MINOR.reduce(
      (acc, item) => ({ ...acc, [item.key]: true }),
      none,
    );
    expect(severeCap(all).minorCount).toBe(9);
    expect(severeCap(all).severe).toBe(true);
  });

  it("prefers the major limb when both are met", () => {
    const r = severeCap({
      ...none,
      septicShock: true,
      tachypnoea: true,
      confusion: true,
      uraemiaOver20: true,
    });
    expect(r.metBy).toBe("major");
    expect(r.majorCount).toBe(1);
    expect(r.minorCount).toBe(3);
  });
});

describe("steroidGuidance", () => {
  it("withholds below severe", () => {
    const g = steroidGuidance({ severe: false, influenza: false, septicShock: false });
    expect(g.verdict).toBe("not-indicated");
    expect(g.regimen).toBe(null);
  });

  it("indicates hydrocortisone in severe CAP", () => {
    const g = steroidGuidance({ severe: true, influenza: false, septicShock: false });
    expect(g.verdict).toBe("indicated");
    expect(g.regimen).toContain("Hydrocortisone 200 mg/day");
  });

  it("flags influenza as outside the trial", () => {
    const g = steroidGuidance({ severe: true, influenza: true, septicShock: false });
    expect(g.verdict).toBe("outside-trial");
    expect(g.regimen).toBe(null);
    expect(g.reason).toContain("CAPE-COD");
  });

  it("flags septic shock as outside the trial, and separates the two questions", () => {
    const g = steroidGuidance({ severe: true, influenza: false, septicShock: true });
    expect(g.verdict).toBe("outside-trial");
    expect(g.reason).toContain("shock");
  });

  it("lets influenza outrank septic shock, since harm is the stronger signal", () => {
    const g = steroidGuidance({ severe: true, influenza: true, septicShock: true });
    expect(g.verdict).toBe("outside-trial");
    expect(g.regimen).toBe(null);
  });
});
