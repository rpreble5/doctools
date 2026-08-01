/**
 * Pneumonia Severity Index (PSI / PORT).
 *
 * Fine MJ et al, NEJM 1997. Derived on ~14,000 patients and validated
 * on ~38,000, and the score the 2019 ATS/IDSA guideline recommends over
 * CURB-65 for site of care — not on discrimination (0.80 against 0.76)
 * but because cluster-randomised trials showed that using it safely
 * reduces low-risk hospitalisations. Awaiting attending review.
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
 * ---
 *
 * The score is modelled here as *findings*, not measurements, because
 * that is what it is: age is the only continuous variable, and every
 * other item is a single bit at a published cut point. Asking someone
 * to type "128" for a systolic that is scored purely as "under 90 or
 * not" is a worse interface and a less honest model.
 *
 * findingsFromValues() converts real measurements at the cut points,
 * and is where the boundary behaviour is tested.
 */

export type PsiClass = "I" | "II" | "III" | "IV" | "V";

export interface PsiFindings {
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
  /** Respiratory rate 30 or more. */
  tachypnoea: boolean;
  /** Systolic under 90. */
  hypotension: boolean;
  /** Under 35 °C, or 40 °C and over. */
  temperatureExtreme: boolean;
  /** Pulse 125 or more. */
  tachycardia: boolean;
  pleuralEffusion: boolean;
  /** PaO₂ under 60, or saturations under 90%. */
  hypoxaemia: boolean;

  // investigations — undefined means not measured, which is not the
  // same as normal and must not be scored as zero silently
  /** Arterial pH under 7.35. */
  acidosis?: boolean;
  /** BUN 30 mg/dL or more. */
  uraemia?: boolean;
  /** Sodium under 130. */
  hyponatraemia?: boolean;
  /** Glucose 250 mg/dL or more. */
  hyperglycaemia?: boolean;
  /** Haematocrit under 30%. */
  anaemia?: boolean;
}

export interface PsiContribution {
  label: string;
  points: number;
}

export interface PsiResult {
  points: number;
  riskClass: PsiClass;
  contributions: PsiContribution[];
  siteOfCare: string;
  mortalityBand: string;
}

/* ------------------------------------------------------------------
   Measurements → findings
   ------------------------------------------------------------------ */

export interface PsiValues {
  ageYears: number;
  sex: "male" | "female";
  nursingHomeResident: boolean;
  neoplasticDisease: boolean;
  liverDisease: boolean;
  heartFailure: boolean;
  cerebrovascularDisease: boolean;
  renalDisease: boolean;
  alteredMentalStatus: boolean;
  respiratoryRate: number;
  systolicBp: number;
  temperatureC: number;
  pulse: number;
  pleuralEffusion: boolean;
  arterialPh?: number;
  bunMgDl?: number;
  sodiumMmolL?: number;
  glucoseMgDl?: number;
  haematocritPct?: number;
  pao2MmHg?: number;
  oxygenSaturationPct?: number;
}

const atThreshold = <T,>(
  value: T | undefined,
  test: (v: T) => boolean,
): boolean | undefined => (value === undefined ? undefined : test(value));

export function findingsFromValues(v: PsiValues): PsiFindings {
  return {
    ageYears: v.ageYears,
    sex: v.sex,
    nursingHomeResident: v.nursingHomeResident,
    neoplasticDisease: v.neoplasticDisease,
    liverDisease: v.liverDisease,
    heartFailure: v.heartFailure,
    cerebrovascularDisease: v.cerebrovascularDisease,
    renalDisease: v.renalDisease,
    alteredMentalStatus: v.alteredMentalStatus,
    tachypnoea: v.respiratoryRate >= 30,
    hypotension: v.systolicBp < 90,
    temperatureExtreme: v.temperatureC < 35 || v.temperatureC >= 40,
    tachycardia: v.pulse >= 125,
    pleuralEffusion: v.pleuralEffusion,
    hypoxaemia:
      (v.pao2MmHg !== undefined && v.pao2MmHg < 60) ||
      (v.oxygenSaturationPct !== undefined && v.oxygenSaturationPct < 90),
    acidosis: atThreshold(v.arterialPh, (p) => p < 7.35),
    uraemia: atThreshold(v.bunMgDl, (b) => b >= 30),
    hyponatraemia: atThreshold(v.sodiumMmolL, (s) => s < 130),
    hyperglycaemia: atThreshold(v.glucoseMgDl, (g) => g >= 250),
    anaemia: atThreshold(v.haematocritPct, (h) => h < 30),
  };
}

/* ------------------------------------------------------------------
   Step one
   ------------------------------------------------------------------ */

/**
 * The findings that can put a patient out of class I.
 *
 * Worth naming, because the answer is not obvious from the score sheet:
 * the gate is the five comorbidities, four vital signs and mental
 * status. Nursing home residence, pleural effusion, oxygenation and
 * every laboratory value are absent from it — those only begin to add
 * points once a patient has already fallen out.
 *
 * So for anyone fifty or under, this list is the entire set of things
 * still worth checking.
 */
export const STEP_ONE_FACTORS = [
  "neoplasticDisease",
  "liverDisease",
  "heartFailure",
  "cerebrovascularDisease",
  "renalDisease",
  "alteredMentalStatus",
  "tachycardia",
  "tachypnoea",
  "hypotension",
  "temperatureExtreme",
] as const;

export type StepOneFactor = (typeof STEP_ONE_FACTORS)[number];

export const isStepOneFactor = (key: string): key is StepOneFactor =>
  (STEP_ONE_FACTORS as readonly string[]).includes(key);

/**
 * What is keeping this patient out of class I. Empty means they are in
 * it, and no laboratory work is needed to say so — which is the whole
 * value of step one and the part every calculator skips.
 */
export function classOneBlockers(f: PsiFindings): string[] {
  const blockers: string[] = [];
  if (f.ageYears > 50) blockers.push("Over 50");
  if (f.neoplasticDisease) blockers.push("Neoplastic disease");
  if (f.liverDisease) blockers.push("Liver disease");
  if (f.heartFailure) blockers.push("Heart failure");
  if (f.cerebrovascularDisease) blockers.push("Cerebrovascular disease");
  if (f.renalDisease) blockers.push("Renal disease");
  if (f.alteredMentalStatus) blockers.push("Altered mental status");
  if (f.tachycardia) blockers.push("Pulse 125 or more");
  if (f.tachypnoea) blockers.push("Respiratory rate 30 or more");
  if (f.hypotension) blockers.push("Systolic under 90");
  if (f.temperatureExtreme)
    blockers.push("Temperature under 35 or 40 and over");
  return blockers;
}

export const isClassOne = (f: PsiFindings): boolean =>
  classOneBlockers(f).length === 0;

/* ------------------------------------------------------------------
   Investigation headroom

   PSI has no unmeasured state — it was derived on patients who had the
   full workup, and an absent value simply scores nothing. That is a
   quiet trap: a patient whose bloods are not back reads exactly like a
   patient whose bloods came back clean.

   The score cannot distinguish them, so the tool does not pretend to.
   It reports how many points are still on the table and the class they
   would reach, and leaves the reader to know which of the two they are
   looking at.
   ------------------------------------------------------------------ */

const INVESTIGATIONS = [
  { key: "acidosis", label: "pH", maxPoints: 30 },
  { key: "uraemia", label: "BUN", maxPoints: 20 },
  { key: "hyponatraemia", label: "sodium", maxPoints: 20 },
  { key: "hyperglycaemia", label: "glucose", maxPoints: 10 },
  { key: "anaemia", label: "haematocrit", maxPoints: 10 },
] as const;

export interface PsiHeadroom {
  /** Investigations not currently scoring, and what each would add. */
  unscored: { label: string; maxPoints: number }[];
  points: number;
  /** The class reached if every unscored investigation were abnormal. */
  worstCaseClass: PsiClass;
  /** True when every investigation is already scoring. */
  exhausted: boolean;
}

export function investigationHeadroom(f: PsiFindings): PsiHeadroom {
  const unscored = INVESTIGATIONS.filter((i) => f[i.key] !== true).map((i) => ({
    label: i.label,
    maxPoints: i.maxPoints,
  }));

  const points = unscored.reduce((sum, u) => sum + u.maxPoints, 0);

  return {
    unscored,
    points,
    worstCaseClass: classFor(psi(f).points + points),
    exhausted: unscored.length === 0,
  };
}

const classFor = (points: number): PsiClass =>
  points <= 70 ? "II" : points <= 90 ? "III" : points <= 130 ? "IV" : "V";

/* ------------------------------------------------------------------
   Scoring
   ------------------------------------------------------------------ */

export function psi(f: PsiFindings): PsiResult {
  const contributions: PsiContribution[] = [];
  const add = (label: string, points: number) => {
    if (points !== 0) contributions.push({ label, points });
  };

  const agePoints = f.sex === "male" ? f.ageYears : f.ageYears - 10;
  add(f.sex === "male" ? "Age" : "Age, less 10 for female", agePoints);
  add("Nursing home resident", f.nursingHomeResident ? 10 : 0);

  add("Neoplastic disease", f.neoplasticDisease ? 30 : 0);
  add("Liver disease", f.liverDisease ? 20 : 0);
  add("Heart failure", f.heartFailure ? 10 : 0);
  add("Cerebrovascular disease", f.cerebrovascularDisease ? 10 : 0);
  add("Renal disease", f.renalDisease ? 10 : 0);

  add("Altered mental status", f.alteredMentalStatus ? 20 : 0);
  add("Respiratory rate 30 or more", f.tachypnoea ? 20 : 0);
  add("Systolic under 90", f.hypotension ? 20 : 0);
  add("Temperature under 35 or 40 and over", f.temperatureExtreme ? 15 : 0);
  add("Pulse 125 or more", f.tachycardia ? 10 : 0);

  add("Arterial pH under 7.35", f.acidosis ? 30 : 0);
  add("BUN 30 mg/dL or more", f.uraemia ? 20 : 0);
  add("Sodium under 130", f.hyponatraemia ? 20 : 0);
  add("Glucose 250 mg/dL or more", f.hyperglycaemia ? 10 : 0);
  add("Haematocrit under 30%", f.anaemia ? 10 : 0);
  add("PaO₂ under 60, or saturations under 90%", f.hypoxaemia ? 10 : 0);
  add("Pleural effusion", f.pleuralEffusion ? 10 : 0);

  const points = contributions.reduce((sum, c) => sum + c.points, 0);
  const riskClass: PsiClass = isClassOne(f) ? "I" : classFor(points);

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
