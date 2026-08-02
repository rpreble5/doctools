import { describe, expect, it } from "vitest";
import {
  classOneBlockers,
  findingsFromValues,
  isClassOne,
  psi,
  investigationHeadroom,
  isStepOneFactor,
  STEP_ONE_FACTORS,
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
  tachypnea: false,
  hypotension: false,
  temperatureExtreme: false,
  tachycardia: false,
  pleuralEffusion: false,
  hypoxemia: false,
  acidosis: false,
  uremia: false,
  hyponatremia: false,
  hyperglycemia: false,
  anemia: false,
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
   Thresholds — the boundary behavior lives here
   ================================================================ */

describe("findingsFromValues", () => {
  it("scores respiratory rate at 30, not 29", () => {
    expect(findingsFromValues({ ...values, respiratoryRate: 29 }).tachypnea).toBe(false);
    expect(findingsFromValues({ ...values, respiratoryRate: 30 }).tachypnea).toBe(true);
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

    expect(findingsFromValues({ ...values, bunMgDl: 29 }).uremia).toBe(false);
    expect(findingsFromValues({ ...values, bunMgDl: 30 }).uremia).toBe(true);

    expect(findingsFromValues({ ...values, sodiumMmolL: 130 }).hyponatremia).toBe(false);
    expect(findingsFromValues({ ...values, sodiumMmolL: 129 }).hyponatremia).toBe(true);

    expect(findingsFromValues({ ...values, glucoseMgDl: 249 }).hyperglycemia).toBe(false);
    expect(findingsFromValues({ ...values, glucoseMgDl: 250 }).hyperglycemia).toBe(true);

    expect(findingsFromValues({ ...values, hematocritPct: 30 }).anemia).toBe(false);
    expect(findingsFromValues({ ...values, hematocritPct: 29 }).anemia).toBe(true);
  });

  it("takes hypoxemia from either PaO₂ or saturations", () => {
    expect(findingsFromValues({ ...values, pao2MmHg: 60 }).hypoxemia).toBe(false);
    expect(findingsFromValues({ ...values, pao2MmHg: 59 }).hypoxemia).toBe(true);
    expect(findingsFromValues({ ...values, oxygenSaturationPct: 90 }).hypoxemia).toBe(false);
    expect(findingsFromValues({ ...values, oxygenSaturationPct: 89 }).hypoxemia).toBe(true);
  });

  it("leaves an unmeasured investigation undefined rather than false", () => {
    const f = findingsFromValues(values);
    expect(f.acidosis).toBeUndefined();
    expect(f.uremia).toBeUndefined();
    expect(f.hyponatremia).toBeUndefined();
    expect(f.hyperglycemia).toBeUndefined();
    expect(f.anemia).toBeUndefined();
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
        tachypnea: true,
      }),
    ).toEqual(["Over 50", "Renal disease", "Respiratory rate 30 or more"]);
  });

  it("is not affected by laboratory findings — step one needs no bloods", () => {
    expect(isClassOne({ ...well, uremia: true, acidosis: true })).toBe(true);
  });

  it("drops out on any deranged vital", () => {
    expect(isClassOne({ ...well, tachycardia: true })).toBe(false);
    expect(isClassOne({ ...well, hypotension: true })).toBe(false);
    expect(isClassOne({ ...well, temperatureExtreme: true })).toBe(false);
  });
});

describe("STEP_ONE_FACTORS", () => {
  it("holds exactly the findings that can put a patient out of class I", () => {
    // Every listed factor, on its own, must break the gate.
    for (const key of STEP_ONE_FACTORS) {
      expect(isClassOne({ ...well, [key]: true })).toBe(false);
    }
  });

  it("excludes the findings that only add points", () => {
    // These score, but cannot move anyone out of class I.
    for (const key of [
      "nursingHomeResident",
      "pleuralEffusion",
      "hypoxemia",
      "acidosis",
      "uremia",
      "hyponatremia",
      "hyperglycemia",
      "anemia",
    ]) {
      expect(isStepOneFactor(key)).toBe(false);
      expect(isClassOne({ ...well, [key]: true })).toBe(true);
    }
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
        tachypnea: true,
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
        uremia: true,
        hyponatremia: true,
        hyperglycemia: true,
        anemia: true,
        hypoxemia: true,
        pleuralEffusion: true,
      }).points,
    ).toBe(178);
  });

  it("scores an unmeasured investigation as nothing", () => {
    const unmeasured = { ...well, ageYears: 60, uremia: undefined };
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

describe("investigationHeadroom", () => {
  const noLabs: PsiFindings = {
    ...well,
    ageYears: 68,
    acidosis: undefined,
    uremia: undefined,
    hyponatremia: undefined,
    hyperglycemia: undefined,
    anemia: undefined,
  };

  it("counts every investigation that is not scoring", () => {
    const h = investigationHeadroom(noLabs);
    expect(h.exhausted).toBe(false);
    expect(h.unscored.map((u) => u.label)).toEqual([
      "pH",
      "BUN",
      "sodium",
      "glucose",
      "hematocrit",
    ]);
    expect(h.points).toBe(90); // 30 + 20 + 20 + 10 + 10
  });

  it("treats a normal result the same as an absent one, because the score does", () => {
    const allNormal = {
      ...noLabs,
      acidosis: false,
      uremia: false,
      hyponatremia: false,
      hyperglycemia: false,
      anemia: false,
    };
    expect(investigationHeadroom(allNormal).points).toBe(
      investigationHeadroom(noLabs).points,
    );
  });

  it("shows the class still reachable — the reason this exists", () => {
    expect(psi(noLabs).riskClass).toBe("II"); // 68 points
    expect(investigationHeadroom(noLabs).worstCaseClass).toBe("V"); // 158
  });

  it("shrinks as abnormalities are marked", () => {
    const h = investigationHeadroom({ ...noLabs, uremia: true, acidosis: true });
    expect(h.unscored.map((u) => u.label)).toEqual([
      "sodium",
      "glucose",
      "hematocrit",
    ]);
    expect(h.points).toBe(40);
  });

  it("is exhausted once every investigation scores", () => {
    const h = investigationHeadroom({
      ...noLabs,
      acidosis: true,
      uremia: true,
      hyponatremia: true,
      hyperglycemia: true,
      anemia: true,
    });
    expect(h.exhausted).toBe(true);
    expect(h.points).toBe(0);
  });
});
