/**
 * Pneumonia Severity Index (PSI / PORT).
 *
 * Fine MJ et al, NEJM 1997. Derived on ~14,000 patients and validated
 * on ~38,000, and the score the 2019 ATS/IDSA guideline recommends over
 * CURB-65 for site of care — not because its discrimination is higher
 * (0.80 against 0.76) but because cluster-randomised trials showed that
 * using it safely reduces low-risk hospitalisations. Awaiting attending
 * review.
 *
 * Two things it does not do, both of which matter:
 *
 * It predicts thirty-day mortality, not level of care. A patient can be
 * class II and still need admission for oxygen, fluids, or because
 * there is nobody at home. The guideline says this explicitly.
 *
 * It is dominated by age. A thirty-year-old with septic pneumonia can
 * land in class II. Physiology has to be read on its own.
 *
 * Class I is assigned by the step-one algorithm rather than by points:
 * fifty or under, no listed comorbidity, normal mental status and
 * vitals.
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

/** Step one: the low-risk patient who never needs the point count. */
export function isClassOne(i: PsiInput): boolean {
  return classOneBlockers(i).length === 0;
}

/**
 * What is keeping this patient out of class I. Empty means they are in
 * it, and no laboratory work is needed to say so — which is the whole
 * value of step one and the part every calculator skips.
 */
export function classOneBlockers(i: PsiInput): string[] {
  const blockers: string[] = [];
  if (i.ageYears > 50) blockers.push("Over 50");
  if (i.neoplasticDisease) blockers.push("Neoplastic disease");
  if (i.liverDisease) blockers.push("Liver disease");
  if (i.heartFailure) blockers.push("Heart failure");
  if (i.cerebrovascularDisease) blockers.push("Cerebrovascular disease");
  if (i.renalDisease) blockers.push("Renal disease");
  if (i.alteredMentalStatus) blockers.push("Altered mental status");
  if (i.pulse >= 125) blockers.push("Pulse 125 or more");
  if (i.respiratoryRate >= 30) blockers.push("Respiratory rate 30 or more");
  if (i.systolicBp < 90) blockers.push("Systolic under 90");
  if (i.temperatureC < 35 || i.temperatureC >= 40)
    blockers.push("Temperature under 35 or 40 and over");
  return blockers;
}

/**
 * Investigations that carry points, and what each is worth at worst.
 *
 * This exists because of a real trap: an unmeasured value scores zero,
 * so a patient worked up without labs reads reassuringly low. The tool
 * has to be able to say "class II on what you have, but you have not
 * measured the things that could make it class IV".
 */
const INVESTIGATIONS = [
  { key: "arterialPh", label: "Arterial pH", maxPoints: 30 },
  { key: "bunMgDl", label: "BUN", maxPoints: 20 },
  { key: "sodiumMmolL", label: "Sodium", maxPoints: 20 },
  { key: "glucoseMgDl", label: "Glucose", maxPoints: 10 },
  { key: "haematocritPct", label: "Haematocrit", maxPoints: 10 },
  { key: "oxygenation", label: "PaO₂ or saturations", maxPoints: 10 },
] as const;

export interface PsiCompleteness {
  missing: { label: string; maxPoints: number }[];
  maxAdditionalPoints: number;
  /** The class this patient could reach if every missing value were abnormal. */
  worstCaseClass: PsiClass;
  complete: boolean;
}

export function psiCompleteness(input: PsiInput): PsiCompleteness {
  const measured: Record<string, boolean> = {
    arterialPh: input.arterialPh !== undefined,
    bunMgDl: input.bunMgDl !== undefined,
    sodiumMmolL: input.sodiumMmolL !== undefined,
    glucoseMgDl: input.glucoseMgDl !== undefined,
    haematocritPct: input.haematocritPct !== undefined,
    oxygenation:
      input.pao2MmHg !== undefined || input.oxygenSaturationPct !== undefined,
  };

  const missing = INVESTIGATIONS.filter((i) => !measured[i.key]).map((i) => ({
    label: i.label,
    maxPoints: i.maxPoints,
  }));

  const maxAdditionalPoints = missing.reduce((sum, m) => sum + m.maxPoints, 0);
  const worstCasePoints = psi(input).points + maxAdditionalPoints;

  return {
    missing,
    maxAdditionalPoints,
    worstCaseClass: classFor(worstCasePoints),
    complete: missing.length === 0,
  };
}

const classFor = (points: number): PsiClass =>
  points <= 70 ? "II" : points <= 90 ? "III" : points <= 130 ? "IV" : "V";

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
