import type { DripFindings } from "@/lib/scores/drip";
import { isStepOneFactor, type PsiFindings } from "@/lib/scores/psi";
import type { SevereCapFindings } from "@/lib/scores/severeCap";

/**
 * The case, as one set of facts.
 *
 * PSI and DRIP share exactly one input out of twenty-nine — they ask
 * genuinely different questions. Grouping the inputs by score therefore
 * made you answer history questions in two places, once for each. These
 * are grouped by where the information comes from instead, which is how
 * it is actually gathered: chart, bedside, film, lab.
 *
 * The groups are narrow on purpose. "Examination" had held the vitals,
 * the chest film and the organ support all in one column, so reading
 * off a set of numbers meant skipping past two findings that come from
 * somewhere else entirely. A group you can read straight down without
 * changing source is faster than a shorter list of longer groups.
 *
 * Each fact declares which scores it feeds, so a row can say so without
 * anyone maintaining a second list.
 */

export type Category =
  | "comorbidity"
  | "exposure"
  | "vitals"
  | "support"
  | "imaging"
  | "labs";

export type FactKey =
  // shared
  | "longTermCare"
  // comorbidity
  | "neoplasticDisease"
  | "liverDisease"
  | "heartFailure"
  | "cerebrovascularDisease"
  | "renalDisease"
  | "chronicPulmonaryDisease"
  // exposure
  | "antibioticsWithin60Days"
  | "hospitalizedWithin60Days"
  | "priorDrugResistantInfection"
  | "mrsaColonization"
  | "tubeFeeding"
  | "poorFunctionalStatus"
  | "woundCare"
  | "gastricAcidSuppression"
  // vitals
  | "tachypnea"
  | "hypotension"
  | "tachycardia"
  | "hypoxemia"
  | "pafiUnder250"
  | "alteredMentalStatus"
  // support
  | "hypotensionNeedingFluids"
  | "septicShock"
  | "mechanicalVentilation"
  // imaging
  | "pleuralEffusion"
  | "multilobarInfiltrates"
  // labs
  | "acidosis"
  | "hyponatremia"
  | "hyperglycemia"
  | "anemia"
  | "leukopenia"
  | "thrombocytopenia"
  // context for the steroid decision
  | "influenza";

export interface CaseFact {
  key: FactKey;
  label: string;
  category: Category;
  /** Points contributed to each score. A fact may feed more than one. */
  psi?: number;
  drip?: number;
  /** Severe CAP is met by counting criteria, not points. */
  severe?: "major" | "minor";
  /** Bears on the steroid decision without being a criterion. */
  steroidContext?: boolean;
}

export const CASE_FACTS: CaseFact[] = [
  // ---- comorbidity ----
  { key: "neoplasticDisease", label: "Neoplastic", category: "comorbidity", psi: 30 },
  { key: "liverDisease", label: "Liver", category: "comorbidity", psi: 20 },
  { key: "heartFailure", label: "Heart failure", category: "comorbidity", psi: 10 },
  { key: "cerebrovascularDisease", label: "Cerebrovascular", category: "comorbidity", psi: 10 },
  { key: "renalDisease", label: "Renal", category: "comorbidity", psi: 10 },
  { key: "chronicPulmonaryDisease", label: "Chronic pulmonary", category: "comorbidity", drip: 1 },

  // ---- exposure ----
  { key: "longTermCare", label: "Long-term care", category: "exposure", psi: 10, drip: 2 },
  { key: "antibioticsWithin60Days", label: "Antibiotics, 60 d", category: "exposure", drip: 2 },
  { key: "hospitalizedWithin60Days", label: "Hospitalized, 60 d", category: "exposure", drip: 1 },
  { key: "priorDrugResistantInfection", label: "Prior resistant infection", category: "exposure", drip: 2 },
  { key: "mrsaColonization", label: "MRSA colonized", category: "exposure", drip: 1 },
  { key: "tubeFeeding", label: "Tube feeding", category: "exposure", drip: 2 },
  { key: "poorFunctionalStatus", label: "Poor functional status", category: "exposure", drip: 1 },
  { key: "woundCare", label: "Wound care", category: "exposure", drip: 1 },
  { key: "gastricAcidSuppression", label: "Gastric acid suppression", category: "exposure", drip: 1 },

  /* ---- vitals ----
     The numbers taken at the bedside, in the order a chart lists them.
     Mental status sits with them because it is observed at the same
     moment, and PaO₂/FiO₂ directly under the saturation because the two
     answer the same question at different cost. */
  { key: "tachypnea", label: "Resp rate ≥ 30", category: "vitals", psi: 20, severe: "minor" },
  { key: "hypotension", label: "Systolic < 90", category: "vitals", psi: 20 },
  { key: "tachycardia", label: "Pulse ≥ 125", category: "vitals", psi: 10 },
  { key: "hypoxemia", label: "SpO₂ < 90", category: "vitals", psi: 10 },
  { key: "pafiUnder250", label: "PaO₂/FiO₂ ≤ 250", category: "vitals", severe: "minor" },
  { key: "alteredMentalStatus", label: "Altered mental status", category: "vitals", psi: 20, severe: "minor" },

  /* ---- support ----
     Not findings but what is already being done about them. All three
     are severe-CAP criteria and none feeds PSI, so they belong apart
     from the vitals they respond to. */
  { key: "hypotensionNeedingFluids", label: "Hypotension needing fluids", category: "support", severe: "minor" },
  { key: "septicShock", label: "Septic shock, on pressors", category: "support", severe: "major" },
  { key: "mechanicalVentilation", label: "Needs ventilation", category: "support", severe: "major" },

  // ---- imaging ----
  { key: "pleuralEffusion", label: "Pleural effusion", category: "imaging", psi: 10 },
  { key: "multilobarInfiltrates", label: "Multilobar infiltrates", category: "imaging", severe: "minor" },

  // ---- labs ----
  { key: "acidosis", label: "pH < 7.35", category: "labs", psi: 30 },
  { key: "hyponatremia", label: "Sodium < 130", category: "labs", psi: 20 },
  { key: "hyperglycemia", label: "Glucose ≥ 250", category: "labs", psi: 10 },
  { key: "anemia", label: "Hematocrit < 30", category: "labs", psi: 10 },
  { key: "leukopenia", label: "White cells < 4000", category: "labs", severe: "minor" },
  { key: "thrombocytopenia", label: "Platelets < 100k", category: "labs", severe: "minor" },
  { key: "influenza", label: "Influenza positive", category: "labs", steroidContext: true },
];

/* ------------------------------------------------------------------
   Facts with more than two states

   Temperature and BUN each appear in two scores at different cut
   points, which as separate checkboxes produced rows that contradicted
   the arithmetic: ticking BUN ≥ 30 made severe CAP count it, while the
   BUN ≥ 20 row still read as inactive. Temperature was worse — PSI's
   fact is a disjunction, so "under 35 or 40 and over" beside "under 36"
   asked the reader to resolve the logic themselves.

   One row with mutually exclusive levels states the measurement once
   and lets each score take what it needs.
   ------------------------------------------------------------------ */

export interface LevelOption {
  value: string;
  label: string;
  psi?: number;
  drip?: number;
  severe?: "major" | "minor";
}

export interface CaseLevel {
  key: LevelKey;
  label: string;
  category: Category;
  options: LevelOption[];
}

export type LevelKey = "temperature" | "bun";

export const CASE_LEVELS: CaseLevel[] = [
  {
    key: "temperature",
    label: "Temperature",
    category: "vitals",
    options: [
      { value: "under35", label: "< 35", psi: 15, severe: "minor" },
      { value: "band35to36", label: "35–36", severe: "minor" },
      { value: "normal", label: "36–40" },
      { value: "over40", label: "≥ 40", psi: 15 },
    ],
  },
  {
    key: "bun",
    label: "BUN",
    category: "labs",
    options: [
      { value: "under20", label: "< 20" },
      { value: "over20", label: "≥ 20", severe: "minor" },
      { value: "over30", label: "≥ 30", psi: 20, severe: "minor" },
    ],
  },
];

export const levelsIn = (category: Category): CaseLevel[] =>
  CASE_LEVELS.filter((l) => l.category === category);

/**
 * A levelled fact is live if any of its bands feeds the focused score.
 * Class I does not dim either of these, because both also feed severe
 * CAP, which keeps counting after PSI stops.
 */
export function isLevelLive(level: CaseLevel, focus: Focus): boolean {
  if (focus === "all") return true;
  return level.options.some((option) =>
    focus === "psi"
      ? option.psi !== undefined
      : focus === "drip"
        ? option.drip !== undefined
        : option.severe !== undefined,
  );
}

export const CATEGORY_LABEL: Record<Category, string> = {
  comorbidity: "Comorbidity",
  exposure: "Exposure",
  vitals: "Vitals",
  support: "Support",
  imaging: "Imaging",
  labs: "Labs",
};

/**
 * How the groups sit on the page: four columns, some carrying two
 * groups stacked.
 *
 * Imaging is two rows and would waste a column of its own, so it sits
 * above the labs — both are things that come back rather than things
 * you observe. Support sits under the vitals it responds to. The
 * arrangement also happens to even the columns out, which the previous
 * one did not: examination ran to eleven rows beside comorbidity's six.
 */
export const CASE_COLUMNS: Category[][] = [
  ["comorbidity"],
  ["exposure"],
  ["vitals", "support"],
  ["imaging", "labs"],
];

export const factsIn = (category: Category): CaseFact[] =>
  CASE_FACTS.filter((f) => f.category === category);

/* ------------------------------------------------------------------
   The case
   ------------------------------------------------------------------ */

export type CaseState = Record<FactKey, boolean> & {
  ageYears: number;
  sex: "male" | "female";
  temperature: "under35" | "band35to36" | "normal" | "over40";
  bun: "under20" | "over20" | "over30";
};

export const emptyCase = (): CaseState => {
  const facts = Object.fromEntries(
    CASE_FACTS.map((f) => [f.key, false]),
  ) as Record<FactKey, boolean>;
  return {
    ...facts,
    ageYears: 65,
    sex: "male",
    temperature: "normal",
    bun: "under20",
  };
};

export const toPsi = (c: CaseState): PsiFindings => ({
  ageYears: c.ageYears,
  sex: c.sex,
  nursingHomeResident: c.longTermCare,
  neoplasticDisease: c.neoplasticDisease,
  liverDisease: c.liverDisease,
  heartFailure: c.heartFailure,
  cerebrovascularDisease: c.cerebrovascularDisease,
  renalDisease: c.renalDisease,
  alteredMentalStatus: c.alteredMentalStatus,
  tachypnea: c.tachypnea,
  hypotension: c.hypotension,
  temperatureExtreme: c.temperature === "under35" || c.temperature === "over40",
  tachycardia: c.tachycardia,
  pleuralEffusion: c.pleuralEffusion,
  hypoxemia: c.hypoxemia,
  acidosis: c.acidosis,
  uremia: c.bun === "over30",
  hyponatremia: c.hyponatremia,
  hyperglycemia: c.hyperglycemia,
  anemia: c.anemia,
});

/**
 * Severe CAP reads two facts PSI already collects, and two more at
 * different cut points.
 *
 * BUN is the one that can be derived: PSI scores at 30, severe CAP at
 * 20, and thirty is twenty. Ticking the PSI row therefore lights the
 * severe row on its own. Temperature cannot be derived the same way —
 * PSI's fact is "under 35 or 40 and over", which does not imply "under
 * 36" when it was the high limb that was true.
 */
export const toSevereCap = (c: CaseState): SevereCapFindings => ({
  septicShock: c.septicShock,
  mechanicalVentilation: c.mechanicalVentilation,
  tachypnea: c.tachypnea,
  pafiUnder250: c.pafiUnder250,
  multilobarInfiltrates: c.multilobarInfiltrates,
  confusion: c.alteredMentalStatus,
  uremiaOver20: c.bun === "over20" || c.bun === "over30",
  leukopenia: c.leukopenia,
  thrombocytopenia: c.thrombocytopenia,
  hypothermiaUnder36: c.temperature === "under35" || c.temperature === "band35to36",
  hypotensionNeedingFluids: c.hypotensionNeedingFluids,
});

export const toDrip = (c: CaseState): DripFindings => ({
  antibioticsWithin60Days: c.antibioticsWithin60Days,
  tubeFeeding: c.tubeFeeding,
  longTermCare: c.longTermCare,
  priorDrugResistantInfection: c.priorDrugResistantInfection,
  chronicPulmonaryDisease: c.chronicPulmonaryDisease,
  hospitalizedWithin60Days: c.hospitalizedWithin60Days,
  poorFunctionalStatus: c.poorFunctionalStatus,
  mrsaColonization: c.mrsaColonization,
  woundCare: c.woundCare,
  gastricAcidSuppression: c.gastricAcidSuppression,
});

/* ------------------------------------------------------------------
   Which facts are live
   ------------------------------------------------------------------ */

export type Focus = "all" | "psi" | "drip" | "severe";

/**
 * Whether a fact can currently affect anything.
 *
 * Two reasons it might not. The focus filter is the reader's choice —
 * show me only what feeds this score. Class I is the score's own doing:
 * PSI stops before counting, so a fact that feeds only PSI and is not
 * part of the step-one gate cannot change the answer. A fact that also
 * feeds DRIP stays live regardless, because DRIP is still counting.
 */
export function isFactLive(
  fact: CaseFact,
  { focus, psiInClassOne }: { focus: Focus; psiInClassOne: boolean },
): boolean {
  if (focus === "psi" && fact.psi === undefined) return false;
  if (focus === "drip" && fact.drip === undefined) return false;
  if (focus === "severe" && fact.severe === undefined) return false;

  // Class I stops PSI counting, but only PSI. A fact that feeds
  // anything else is still doing work.
  const psiOnly =
    fact.psi !== undefined &&
    fact.drip === undefined &&
    fact.severe === undefined &&
    !fact.steroidContext;

  if (psiInClassOne && psiOnly) return isStepOneFactor(fact.key);
  return true;
}
