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
 * it is actually gathered: comorbidity and exposure off the chart,
 * examination at the bedside, results when they land.
 *
 * Each fact declares which scores it feeds, so a row can say so without
 * anyone maintaining a second list.
 */

export type Category = "comorbidity" | "exposure" | "examination" | "results";

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
  | "hospitalisedWithin60Days"
  | "priorDrugResistantInfection"
  | "mrsaColonisation"
  | "tubeFeeding"
  | "poorFunctionalStatus"
  | "woundCare"
  | "gastricAcidSuppression"
  // examination
  | "alteredMentalStatus"
  | "tachypnoea"
  | "hypotension"
  | "temperatureExtreme"
  | "tachycardia"
  | "hypoxaemia"
  | "pleuralEffusion"
  // results
  | "acidosis"
  | "uraemia"
  | "hyponatraemia"
  | "hyperglycaemia"
  | "anaemia"
  // severe CAP — major
  | "septicShock"
  | "mechanicalVentilation"
  // severe CAP — minor not already collected
  | "multilobarInfiltrates"
  | "hypothermiaUnder36"
  | "hypotensionNeedingFluids"
  | "pafiUnder250"
  | "uraemiaOver20"
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
  { key: "hospitalisedWithin60Days", label: "Hospitalised, 60 d", category: "exposure", drip: 1 },
  { key: "priorDrugResistantInfection", label: "Prior resistant infection", category: "exposure", drip: 2 },
  { key: "mrsaColonisation", label: "MRSA colonised", category: "exposure", drip: 1 },
  { key: "tubeFeeding", label: "Tube feeding", category: "exposure", drip: 2 },
  { key: "poorFunctionalStatus", label: "Poor functional status", category: "exposure", drip: 1 },
  { key: "woundCare", label: "Wound care", category: "exposure", drip: 1 },
  { key: "gastricAcidSuppression", label: "Gastric acid suppression", category: "exposure", drip: 1 },

  // ---- examination ----
  { key: "alteredMentalStatus", label: "Altered mental status", category: "examination", psi: 20, severe: "minor" },
  { key: "tachypnoea", label: "Resp rate ≥ 30", category: "examination", psi: 20, severe: "minor" },
  { key: "hypotension", label: "Systolic < 90", category: "examination", psi: 20 },
  { key: "temperatureExtreme", label: "Temp < 35 or ≥ 40", category: "examination", psi: 15 },
  { key: "tachycardia", label: "Pulse ≥ 125", category: "examination", psi: 10 },
  { key: "hypoxaemia", label: "SpO₂ < 90", category: "examination", psi: 10 },
  { key: "pleuralEffusion", label: "Pleural effusion", category: "examination", psi: 10 },
  { key: "septicShock", label: "Septic shock, on pressors", category: "examination", severe: "major" },
  { key: "mechanicalVentilation", label: "Needs ventilation", category: "examination", severe: "major" },
  { key: "hypotensionNeedingFluids", label: "Hypotension needing fluids", category: "examination", severe: "minor" },
  { key: "hypothermiaUnder36", label: "Temp < 36 °C", category: "examination", severe: "minor" },
  { key: "multilobarInfiltrates", label: "Multilobar infiltrates", category: "examination", severe: "minor" },

  // ---- results ----
  { key: "acidosis", label: "pH < 7.35", category: "results", psi: 30 },
  { key: "uraemia", label: "BUN ≥ 30", category: "results", psi: 20 },
  { key: "hyponatraemia", label: "Sodium < 130", category: "results", psi: 20 },
  { key: "hyperglycaemia", label: "Glucose ≥ 250", category: "results", psi: 10 },
  { key: "anaemia", label: "Haematocrit < 30", category: "results", psi: 10 },
  { key: "uraemiaOver20", label: "BUN ≥ 20", category: "results", severe: "minor" },
  { key: "pafiUnder250", label: "PaO₂/FiO₂ ≤ 250", category: "results", severe: "minor" },
  { key: "leukopenia", label: "White cells < 4000", category: "results", severe: "minor" },
  { key: "thrombocytopenia", label: "Platelets < 100k", category: "results", severe: "minor" },
  { key: "influenza", label: "Influenza positive", category: "results", steroidContext: true },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  comorbidity: "Comorbidity",
  exposure: "Exposure",
  examination: "Examination",
  results: "Results",
};

export const CATEGORIES: Category[] = [
  "comorbidity",
  "exposure",
  "examination",
  "results",
];

export const factsIn = (category: Category): CaseFact[] =>
  CASE_FACTS.filter((f) => f.category === category);

/* ------------------------------------------------------------------
   The case
   ------------------------------------------------------------------ */

export type CaseState = Record<FactKey, boolean> & {
  ageYears: number;
  sex: "male" | "female";
};

export const emptyCase = (): CaseState => {
  const facts = Object.fromEntries(
    CASE_FACTS.map((f) => [f.key, false]),
  ) as Record<FactKey, boolean>;
  return { ...facts, ageYears: 65, sex: "male" };
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
  tachypnoea: c.tachypnoea,
  hypotension: c.hypotension,
  temperatureExtreme: c.temperatureExtreme,
  tachycardia: c.tachycardia,
  pleuralEffusion: c.pleuralEffusion,
  hypoxaemia: c.hypoxaemia,
  acidosis: c.acidosis,
  uraemia: c.uraemia,
  hyponatraemia: c.hyponatraemia,
  hyperglycaemia: c.hyperglycaemia,
  anaemia: c.anaemia,
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
  tachypnoea: c.tachypnoea,
  pafiUnder250: c.pafiUnder250,
  multilobarInfiltrates: c.multilobarInfiltrates,
  confusion: c.alteredMentalStatus,
  uraemiaOver20: c.uraemiaOver20 || c.uraemia,
  leukopenia: c.leukopenia,
  thrombocytopenia: c.thrombocytopenia,
  hypothermiaUnder36: c.hypothermiaUnder36,
  hypotensionNeedingFluids: c.hypotensionNeedingFluids,
});

export const toDrip = (c: CaseState): DripFindings => ({
  antibioticsWithin60Days: c.antibioticsWithin60Days,
  tubeFeeding: c.tubeFeeding,
  longTermCare: c.longTermCare,
  priorDrugResistantInfection: c.priorDrugResistantInfection,
  chronicPulmonaryDisease: c.chronicPulmonaryDisease,
  hospitalisedWithin60Days: c.hospitalisedWithin60Days,
  poorFunctionalStatus: c.poorFunctionalStatus,
  mrsaColonisation: c.mrsaColonisation,
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
