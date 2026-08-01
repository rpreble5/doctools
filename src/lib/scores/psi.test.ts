import { describe, expect, it } from "vitest";
import {
  classOneBlockers,
  findingsFromValues,
  isClassOne,
  psi,
  psiCompleteness,
  type PsiFindings,
  type PsiValues,
} from "./psi";

/** A well 34-year-old: nothing scores, everything measurable is normal. */
const well: PsiFindings = {
  ageYears: 34,
  sex: "male",
  nursingHomeResident: false,
  neoplasticDisease: false,
  liverDisease: false,
  heartFailure: false,
  cerebrovascularDisease: false,
  renalDisease: false,
  alteredMentalStatus: false,
  tachypnoea: false,
  hypotension: false,
  temperatureExtreme: false,
  tachycardia: false,
  pleuralEffusion: false,
  hypoxaemia: false,
  acidosis: false,
  uraemia: false,
  hyponatraemia: false,
  hyperglycaemia: false,
  anaemia: false,
};

const values: PsiValues = {
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

/* ================================================================
   Thresholds — the boundary behaviour lives here
   ================================================================ */

describe("findingsFromValues", () => {
  it("scores respiratory rate at 30, not 29", () => {
    expect(findingsFromValues({ ...values, respiratoryRate: 29 }).tachypnoea).toBe(false);
    expect(findingsFromValues({ ...values, respiratoryRate: 30 }).tachypnoea).toBe(true);
  });

  it("scores systolic under 90, not at 90", () => {
    expect(findingsFromValues({ ...values, systolicBp: 90 }).hypotension).toBe(false);
    expect(findingsFromValues({ ...values, systolicBp: 89 }).hypotension).toBe(true);
  });

  it("scores temperature at both extremes", () => {
    expect(findingsFromValues({ ...values, temperatureC: 35 }).temperatureExtreme).toBe(false);
    expect(findingsFromValues({ ...values, temperatureC: 34.9 }).temperatureExtreme).toBe(true);
    expect(findingsFromValues({ ...values, temperatureC: 39.9 }).temperatureExtreme).toBe(false);
    expect(findingsFromValues({ ...values, temperatureC: 40 }).temperatureExtreme).toBe(true);
  });

  it("scores pulse at 125, not 124", () => {
    expect(findingsFromValues({ ...values, pulse: 124 }).tachycardia).toBe(false);
    expect(findingsFromValues({ ...values, pulse: 125 }).tachycardia).toBe(true);
  });

  it("scores each laboratory threshold at its cut point", () => {
    expect(findingsFromValues({ ...values, arterialPh: 7.35 }).acidosis).toBe(false);
    expect(findingsFromValues({ ...values, arterialPh: 7.34 }).acidosis).toBe(true);

    expect(findingsFromValues({ ...values, bunMgDl: 29 }).uraemia).toBe(false);
    expect(findingsFromValues({ ...values, bunMgDl: 30 }).uraemia).toBe(true);

    expect(findingsFromValues({ ...values, sodiumMmolL: 130 }).hyponatraemia).toBe(false);
    expect(findingsFromValues({ ...values, sodiumMmolL: 129 }).hyponatraemia).toBe(true);

    expect(findingsFromValues({ ...values, glucoseMgDl: 249 }).hyperglycaemia).toBe(false);
    expect(findingsFromValues({ ...values, glucoseMgDl: 250 }).hyperglycaemia).toBe(true);

    expect(findingsFromValues({ ...values, haematocritPct: 30 }).anaemia).toBe(false);
    expect(findingsFromValues({ ...values, haematocritPct: 29 }).anaemia).toBe(true);
  });

  it("takes hypoxaemia from either PaO₂ or saturations", () => {
    expect(findingsFromValues({ ...values, pao2MmHg: 60 }).hypoxaemia).toBe(false);
    expect(findingsFromValues({ ...values, pao2MmHg: 59 }).hypoxaemia).toBe(true);
    expect(findingsFromValues({ ...values, oxygenSaturationPct: 90 }).hypoxaemia).toBe(false);
    expect(findingsFromValues({ ...values, oxygenSaturationPct: 89 }).hypoxaemia).toBe(true);
  });

  it("leaves an unmeasured investigation undefined rather than false", () => {
    const f = findingsFromValues(values);
    expect(f.acidosis).toBeUndefined();
    expect(f.uraemia).toBeUndefined();
    expect(f.hyponatraemia).toBeUndefined();
    expect(f.hyperglycaemia).toBeUndefined();
    expect(f.anaemia).toBeUndefined();
  });
});

/* ================================================================
   Step one
   ================================================================ */

describe("classOneBlockers", () => {
  it("returns nothing for a patient who is in class I", () => {
    expect(classOneBlockers(well)).toEqual([]);
    expect(isClassOne(well)).toBe(true);
    expect(psi(well).riskClass).toBe("I");
  });

  it("names the single reason a patient falls out", () => {
    expect(classOneBlockers({ ...well, ageYears: 62 })).toEqual(["Over 50"]);
    expect(classOneBlockers({ ...well, heartFailure: true })).toEqual(["Heart failure"]);
  });

  it("names every reason when there are several", () => {
    expect(
      classOneBlockers({
        ...well,
        ageYears: 71,
        renalDisease: true,
        tachypnoea: true,
      }),
    ).toEqual(["Over 50", "Renal disease", "Respiratory rate 30 or more"]);
  });

  it("is not affected by laboratory findings — step one needs no bloods", () => {
    expect(isClassOne({ ...well, uraemia: true, acidosis: true })).toBe(true);
  });

  it("drops out on any deranged vital", () => {
    expect(isClassOne({ ...well, tachycardia: true })).toBe(false);
    expect(isClassOne({ ...well, hypotension: true })).toBe(false);
    expect(isClassOne({ ...well, temperatureExtreme: true })).toBe(false);
  });
});

/* ================================================================
   Scoring
   ================================================================ */

describe("PSI point scoring", () => {
  it("scores age directly for men", () => {
    const result = psi({ ...well, ageYears: 68 });
    expect(result.points).toBe(68);
    expect(result.riskClass).toBe("II");
  });

  it("subtracts ten for women", () => {
    expect(psi({ ...well, ageYears: 68, sex: "female" }).points).toBe(58);
  });

  it("adds comorbidity points", () => {
    // 68 + neoplastic 30 + liver 20 + CHF 10 + CVD 10 + renal 10 = 148
    expect(
      psi({
        ...well,
        ageYears: 68,
        neoplasticDisease: true,
        liverDisease: true,
        heartFailure: true,
        cerebrovascularDisease: true,
        renalDisease: true,
      }).points,
    ).toBe(148);
  });

  it("adds examination points", () => {
    // 68 + AMS 20 + RR 20 + SBP 20 + temp 15 + pulse 10 = 153
    expect(
      psi({
        ...well,
        ageYears: 68,
        alteredMentalStatus: true,
        tachypnoea: true,
        hypotension: true,
        temperatureExtreme: true,
        tachycardia: true,
      }).points,
    ).toBe(153);
  });

  it("adds investigation points", () => {
    // 68 + pH 30 + BUN 20 + Na 20 + glucose 10 + Hct 10 + hypoxia 10 + effusion 10 = 178
    expect(
      psi({
        ...well,
        ageYears: 68,
        acidosis: true,
        uraemia: true,
        hyponatraemia: true,
        hyperglycaemia: true,
        anaemia: true,
        hypoxaemia: true,
        pleuralEffusion: true,
      }).points,
    ).toBe(178);
  });

  it("scores an unmeasured investigation as nothing", () => {
    const unmeasured = { ...well, ageYears: 60, uraemia: undefined };
    expect(psi(unmeasured).points).toBe(60);
  });

  it("bands risk classes at the published cut points", () => {
    expect(psi({ ...well, ageYears: 70 }).riskClass).toBe("II"); // 70
    expect(psi({ ...well, ageYears: 71 }).riskClass).toBe("III"); // 71
    expect(psi({ ...well, ageYears: 90 }).riskClass).toBe("III"); // 90
    expect(psi({ ...well, ageYears: 91 }).riskClass).toBe("IV"); // 91
    expect(psi({ ...well, ageYears: 100, neoplasticDisease: true }).riskClass).toBe("IV"); // 130
    expect(psi({ ...well, ageYears: 101, neoplasticDisease: true }).riskClass).toBe("V"); // 131
  });

  it("maps class to site of care", () => {
    expect(psi({ ...well, ageYears: 70 }).siteOfCare).toBe("Outpatient");
    expect(psi({ ...well, ageYears: 95 }).siteOfCare).toBe("Admit");
    expect(psi({ ...well, ageYears: 140 }).siteOfCare).toBe(
      "Admit, assess for critical care",
    );
  });
});

/* ================================================================
   Completeness
   ================================================================ */

describe("psiCompleteness", () => {
  const noBloods: PsiFindings = {
    ...well,
    ageYears: 68,
    acidosis: undefined,
    uraemia: undefined,
    hyponatraemia: undefined,
    hyperglycaemia: undefined,
    anaemia: undefined,
  };

  it("lists every unmeasured investigation", () => {
    const c = psiCompleteness(noBloods);
    expect(c.complete).toBe(false);
    expect(c.missing.map((m) => m.label)).toEqual([
      "Arterial pH",
      "BUN",
      "Sodium",
      "Glucose",
      "Haematocrit",
    ]);
    expect(c.maxAdditionalPoints).toBe(90); // 30 + 20 + 20 + 10 + 10
  });

  it("shows how much worse the class could be — the reason this exists", () => {
    expect(psi(noBloods).riskClass).toBe("II"); // 68 points
    expect(psiCompleteness(noBloods).worstCaseClass).toBe("V"); // 68 + 90 = 158
  });

  it("shrinks as values are entered", () => {
    const partial = { ...noBloods, uraemia: false, hyponatraemia: false };
    const c = psiCompleteness(partial);
    expect(c.missing.map((m) => m.label)).toEqual([
      "Arterial pH",
      "Glucose",
      "Haematocrit",
    ]);
    expect(c.maxAdditionalPoints).toBe(50);
  });

  it("counts a normal result as measured, not missing", () => {
    const c = psiCompleteness({ ...noBloods, acidosis: false });
    expect(c.missing.map((m) => m.label)).not.toContain("Arterial pH");
  });

  it("reports complete once everything is entered", () => {
    const c = psiCompleteness({ ...well, ageYears: 68 });
    expect(c.complete).toBe(true);
    expect(c.missing).toEqual([]);
    expect(c.maxAdditionalPoints).toBe(0);
    expect(c.worstCaseClass).toBe("II");
  });
});
