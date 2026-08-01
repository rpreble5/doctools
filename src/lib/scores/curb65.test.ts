import { describe, expect, it } from "vitest";
import { curb65, type Curb65Input } from "./curb65";

const well: Curb65Input = {
  confusion: false,
  ureaOver7: false,
  respiratoryRate: 18,
  systolicBp: 120,
  diastolicBp: 75,
  ageYears: 40,
};

describe("curb65", () => {
  it("scores zero for a well young patient", () => {
    const result = curb65(well);
    expect(result.score).toBe(0);
    expect(result.siteOfCare).toBe("outpatient");
  });

  it("scores age alone", () => {
    expect(curb65({ ...well, ageYears: 68 }).score).toBe(1);
    expect(curb65({ ...well, ageYears: 65 }).score).toBe(1);
    expect(curb65({ ...well, ageYears: 64 }).score).toBe(0);
  });

  it("counts respiratory rate at the boundary", () => {
    expect(curb65({ ...well, respiratoryRate: 29 }).score).toBe(0);
    expect(curb65({ ...well, respiratoryRate: 30 }).score).toBe(1);
  });

  it("counts either limb of the blood pressure criterion once", () => {
    expect(curb65({ ...well, systolicBp: 88 }).score).toBe(1);
    expect(curb65({ ...well, diastolicBp: 60 }).score).toBe(1);
    expect(curb65({ ...well, systolicBp: 88, diastolicBp: 55 }).score).toBe(1);
  });

  it("scores all five", () => {
    const result = curb65({
      confusion: true,
      ureaOver7: true,
      respiratoryRate: 34,
      systolicBp: 84,
      diastolicBp: 50,
      ageYears: 80,
    });
    expect(result.score).toBe(5);
    expect(result.siteOfCare).toBe("icu");
  });

  it("bands site of care by score", () => {
    expect(curb65({ ...well, ageYears: 70 }).siteOfCare).toBe("outpatient");
    expect(
      curb65({ ...well, ageYears: 70, confusion: true }).siteOfCare,
    ).toBe("consider-admission");
    expect(
      curb65({ ...well, ageYears: 70, confusion: true, ureaOver7: true })
        .siteOfCare,
    ).toBe("admit");
  });
});
