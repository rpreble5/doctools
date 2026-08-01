import { describe, expect, it } from "vitest";
import { isClassOne, psi, type PsiInput } from "./psi";

const young: PsiInput = {
  ageYears: 34,
  sex: "male",
  nursingHomeResident: false,
  neoplasticDisease: false,
  liverDisease: false,
  heartFailure: false,
  cerebrovascularDisease: false,
  renalDisease: false,
  alteredMentalStatus: false,
  respiratoryRate: 18,
  systolicBp: 122,
  temperatureC: 37.8,
  pulse: 88,
  pleuralEffusion: false,
};

describe("PSI step one", () => {
  it("assigns class I to a well patient under 50", () => {
    expect(isClassOne(young)).toBe(true);
    expect(psi(young).riskClass).toBe("I");
  });

  it("drops out of class I on age alone", () => {
    expect(isClassOne({ ...young, ageYears: 51 })).toBe(false);
  });

  it("drops out of class I on any listed comorbidity", () => {
    expect(isClassOne({ ...young, heartFailure: true })).toBe(false);
    expect(isClassOne({ ...young, neoplasticDisease: true })).toBe(false);
  });

  it("drops out of class I on deranged vitals", () => {
    expect(isClassOne({ ...young, respiratoryRate: 30 })).toBe(false);
    expect(isClassOne({ ...young, systolicBp: 88 })).toBe(false);
    expect(isClassOne({ ...young, pulse: 130 })).toBe(false);
    expect(isClassOne({ ...young, temperatureC: 40 })).toBe(false);
    expect(isClassOne({ ...young, temperatureC: 34.5 })).toBe(false);
  });
});

describe("PSI point scoring", () => {
  it("scores age directly for men", () => {
    const result = psi({ ...young, ageYears: 68 });
    expect(result.points).toBe(68);
    expect(result.riskClass).toBe("II");
  });

  it("subtracts ten for women", () => {
    expect(psi({ ...young, ageYears: 68, sex: "female" }).points).toBe(58);
  });

  it("adds comorbidity points", () => {
    // 68 + neoplastic 30 + liver 20 + CHF 10 + CVD 10 + renal 10 = 148
    const result = psi({
      ...young,
      ageYears: 68,
      neoplasticDisease: true,
      liverDisease: true,
      heartFailure: true,
      cerebrovascularDisease: true,
      renalDisease: true,
    });
    expect(result.points).toBe(148);
    expect(result.riskClass).toBe("V");
  });

  it("adds examination points", () => {
    // 68 + AMS 20 + RR 20 + SBP 20 + temp 15 + pulse 10 = 153
    const result = psi({
      ...young,
      ageYears: 68,
      alteredMentalStatus: true,
      respiratoryRate: 32,
      systolicBp: 84,
      temperatureC: 40.2,
      pulse: 130,
    });
    expect(result.points).toBe(153);
  });

  it("adds laboratory points", () => {
    // 68 + pH 30 + BUN 20 + Na 20 + glucose 10 + Hct 10 + hypoxia 10 + effusion 10 = 178
    const result = psi({
      ...young,
      ageYears: 68,
      arterialPh: 7.3,
      bunMgDl: 34,
      sodiumMmolL: 126,
      glucoseMgDl: 280,
      haematocritPct: 27,
      pao2MmHg: 55,
      pleuralEffusion: true,
    });
    expect(result.points).toBe(178);
  });

  it("treats saturations under 90 as hypoxia when PaO2 is absent", () => {
    expect(psi({ ...young, ageYears: 60, oxygenSaturationPct: 88 }).points).toBe(70);
    expect(psi({ ...young, ageYears: 60, oxygenSaturationPct: 93 }).points).toBe(60);
  });

  it("scores unmeasured investigations as zero", () => {
    expect(psi({ ...young, ageYears: 60 }).points).toBe(60);
  });

  it("bands risk classes at the published cut points", () => {
    expect(psi({ ...young, ageYears: 70 }).riskClass).toBe("II"); // 70
    expect(psi({ ...young, ageYears: 71 }).riskClass).toBe("III"); // 71
    expect(psi({ ...young, ageYears: 90 }).riskClass).toBe("III"); // 90
    expect(psi({ ...young, ageYears: 91 }).riskClass).toBe("IV"); // 91
    expect(
      psi({ ...young, ageYears: 100, neoplasticDisease: true }).riskClass,
    ).toBe("IV"); // 130
    expect(
      psi({ ...young, ageYears: 101, neoplasticDisease: true }).riskClass,
    ).toBe("V"); // 131
  });
});
