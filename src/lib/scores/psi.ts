/**
 * Pneumonia Severity Index (PSI / PORT).
 *
 * Fine MJ et al, NEJM 1997. Twenty variables against CURB-65's five,
 * and better at identifying the genuinely low-risk patient who can go
 * home — which is the decision it exists to support. Awaiting
 * attending review.
 *
 * Class I is assigned by the step-one algorithm rather than by points:
 * under 50, no listed comorbidity, normal mental status and vitals.
 */

export interface PsiInput {
  ageYears: number;
  sex: "male" | "female";
  nursingHomeResident: boolean;

  // comorbidity
  neoplasticDisease: boolean;
  liverDisease: boolean;
  heartFailure: boolean;
  cerebrovascularDisease: boolean;
  renalDisease: boolean;

  // examination
  alteredMentalStatus: boolean;
  respiratoryRate: number;
  systolicBp: number;
  temperatureC: number;
  pulse: number;

  // investigations — undefined means not measured, which scores zero
  arterialPh?: number;
  bunMgDl?: number;
  sodiumMmolL?: number;
  glucoseMgDl?: number;
  haematocritPct?: number;
  pao2MmHg?: number;
  oxygenSaturationPct?: number;
  pleuralEffusion: boolean;
}

export interface PsiContribution {
  label: string;
  points: number;
}

export type PsiClass = "I" | "II" | "III" | "IV" | "V";

export interface PsiResult {
  points: number;
  riskClass: PsiClass;
  contributions: PsiContribution[];
  siteOfCare: string;
  mortalityBand: string;
}

const hasListedComorbidity = (i: PsiInput): boolean =>
  i.neoplasticDisease ||
  i.liverDisease ||
  i.heartFailure ||
  i.cerebrovascularDisease ||
  i.renalDisease;

/** Step one: the low-risk patient who never needs the point count. */
export function isClassOne(i: PsiInput): boolean {
  return (
    i.ageYears <= 50 &&
    !hasListedComorbidity(i) &&
    !i.alteredMentalStatus &&
    i.pulse < 125 &&
    i.respiratoryRate < 30 &&
    i.systolicBp >= 90 &&
    i.temperatureC >= 35 &&
    i.temperatureC < 40
  );
}

export function psi(input: PsiInput): PsiResult {
  const contributions: PsiContribution[] = [];
  const add = (label: string, points: number) => {
    if (points !== 0) contributions.push({ label, points });
  };

  // demographics
  const agePoints =
    input.sex === "male" ? input.ageYears : input.ageYears - 10;
  add(input.sex === "male" ? "Age" : "Age, less 10 for female", agePoints);
  add("Nursing home resident", input.nursingHomeResident ? 10 : 0);

  // comorbidity
  add("Neoplastic disease", input.neoplasticDisease ? 30 : 0);
  add("Liver disease", input.liverDisease ? 20 : 0);
  add("Heart failure", input.heartFailure ? 10 : 0);
  add("Cerebrovascular disease", input.cerebrovascularDisease ? 10 : 0);
  add("Renal disease", input.renalDisease ? 10 : 0);

  // examination
  add("Altered mental status", input.alteredMentalStatus ? 20 : 0);
  add("Respiratory rate 30 or more", input.respiratoryRate >= 30 ? 20 : 0);
  add("Systolic under 90", input.systolicBp < 90 ? 20 : 0);
  add(
    "Temperature under 35 or 40 and over",
    input.temperatureC < 35 || input.temperatureC >= 40 ? 15 : 0,
  );
  add("Pulse 125 or more", input.pulse >= 125 ? 10 : 0);

  // investigations
  add("Arterial pH under 7.35", (input.arterialPh ?? 7.4) < 7.35 ? 30 : 0);
  add("BUN 30 mg/dL or more", (input.bunMgDl ?? 0) >= 30 ? 20 : 0);
  add("Sodium under 130", (input.sodiumMmolL ?? 140) < 130 ? 20 : 0);
  add("Glucose 250 mg/dL or more", (input.glucoseMgDl ?? 0) >= 250 ? 10 : 0);
  add("Haematocrit under 30%", (input.haematocritPct ?? 45) < 30 ? 10 : 0);

  const hypoxic =
    (input.pao2MmHg !== undefined && input.pao2MmHg < 60) ||
    (input.oxygenSaturationPct !== undefined &&
      input.oxygenSaturationPct < 90);
  add("PaO₂ under 60, or saturations under 90%", hypoxic ? 10 : 0);
  add("Pleural effusion", input.pleuralEffusion ? 10 : 0);

  const points = contributions.reduce((sum, c) => sum + c.points, 0);

  const riskClass: PsiClass = isClassOne(input)
    ? "I"
    : points <= 70
      ? "II"
      : points <= 90
        ? "III"
        : points <= 130
          ? "IV"
          : "V";

  const siteOfCare =
    riskClass === "I" || riskClass === "II"
      ? "Outpatient"
      : riskClass === "III"
        ? "Brief observation, or outpatient with support"
        : riskClass === "IV"
          ? "Admit"
          : "Admit, assess for critical care";

  const mortalityBand = {
    I: "0.1%",
    II: "0.6%",
    III: "0.9–2.8%",
    IV: "8.2–9.3%",
    V: "27–31%",
  }[riskClass];

  return { points, riskClass, contributions, siteOfCare, mortalityBand };
}
