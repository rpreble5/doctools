/**
 * Drug Resistance in Pneumonia (DRIP) score.
 *
 * Webb et al, Antimicrob Agents Chemother 2016. Derived and
 * prospectively validated across multiple centers to answer the
 * question HCAP used to answer badly: does this patient need cover for
 * MRSA or Pseudomonas? Awaiting attending review.
 *
 * The reason to prefer it is not discrimination alone. HCAP would have
 * increased antipseudomonal prescribing by roughly 300%; DRIP by 49%
 * for the same population. That is a demonstrated effect on management,
 * which is a stronger claim than an area under a curve.
 *
 * It is not, however, what the guideline recommends. The 2019 ATS/IDSA
 * document retired HCAP and asked for *locally validated* risk factors
 * instead of endorsing any published score. DRIP is the best-performing
 * published option, not the sanctioned one, and the tool says so.
 */

export interface DripFindings {
  // major — two points each
  /** Any antibiotic in the previous 60 days. */
  antibioticsWithin60Days: boolean;
  tubeFeeding: boolean;
  /** Nursing home or other long-term care residence. */
  longTermCare: boolean;
  /** Infection with a drug-resistant pathogen in the previous year. */
  priorDrugResistantInfection: boolean;

  // minor — one point each
  chronicPulmonaryDisease: boolean;
  hospitalizedWithin60Days: boolean;
  poorFunctionalStatus: boolean;
  /** MRSA colonization in the previous year. */
  mrsaColonization: boolean;
  woundCare: boolean;
  gastricAcidSuppression: boolean;
}

export interface DripItem {
  key: keyof DripFindings;
  label: string;
  points: 1 | 2;
}

export const DRIP_MAJOR: DripItem[] = [
  { key: "antibioticsWithin60Days", label: "Antibiotics within 60 days", points: 2 },
  { key: "tubeFeeding", label: "Tube feeding", points: 2 },
  { key: "longTermCare", label: "Long-term care residence", points: 2 },
  { key: "priorDrugResistantInfection", label: "Prior resistant infection, 1 y", points: 2 },
];

export const DRIP_MINOR: DripItem[] = [
  { key: "chronicPulmonaryDisease", label: "Chronic pulmonary disease", points: 1 },
  { key: "hospitalizedWithin60Days", label: "Hospitalized within 60 days", points: 1 },
  { key: "poorFunctionalStatus", label: "Poor functional status", points: 1 },
  { key: "mrsaColonization", label: "MRSA colonization, 1 y", points: 1 },
  { key: "woundCare", label: "Wound care", points: 1 },
  { key: "gastricAcidSuppression", label: "Gastric acid suppression", points: 1 },
];

export const DRIP_ITEMS = [...DRIP_MAJOR, ...DRIP_MINOR];

/** Four or more supports cover for drug-resistant organisms. */
export const DRIP_THRESHOLD = 4;

/** The most a patient can score: four majors and six minors. */
export const DRIP_MAX = 14;

export interface DripResult {
  points: number;
  highRisk: boolean;
  contributions: { label: string; points: number }[];
  /** How far from crossing the threshold, in either direction. */
  distanceToThreshold: number;
}

export function drip(f: DripFindings): DripResult {
  const contributions = DRIP_ITEMS.filter((item) => f[item.key]).map((item) => ({
    label: item.label,
    points: item.points as number,
  }));

  const points = contributions.reduce((sum, c) => sum + c.points, 0);

  return {
    points,
    highRisk: points >= DRIP_THRESHOLD,
    contributions,
    distanceToThreshold: DRIP_THRESHOLD - points,
  };
}

/**
 * Published performance at the threshold, for display. Two cohorts,
 * because the spread between them is the honest picture — and a later
 * external validation in a different health system fell to 0.76, which
 * is what usually happens to a score outside the population it was
 * built on.
 */
export const DRIP_PERFORMANCE = {
  derivation: { auroc: "0.90", sensitivity: "0.76", specificity: "0.91", npv: "0.92" },
  validation: { auroc: "0.88", sensitivity: "0.82", specificity: "0.81", npv: "0.90" },
  hcapAuroc: "0.72",
  externalAuroc: "0.76",
};
