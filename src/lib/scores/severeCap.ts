/**
 * IDSA/ATS criteria for severe community-acquired pneumonia, and the
 * corticosteroid decision that hangs off them.
 *
 * Mandell et al 2007, carried forward in the 2019 guideline. One major
 * criterion, or three or more minor, defines severe CAP.
 *
 * Performance is worth stating plainly because it decides how to read a
 * negative: sensitivity about 57%, specificity about 91%, AUC 0.65 for
 * ICU admission. This rules *in*. It misses roughly four in ten, so a
 * patient who fails to meet it has not been cleared.
 *
 * Two of the minor criteria share a variable with PSI at a *different*
 * cut point — BUN at 20 rather than 30, temperature at 36 rather than
 * 35. Reusing PSI's answer would silently under-call severity, so they
 * are separate facts here.
 *
 * Awaiting attending review.
 */

export interface SevereCapFindings {
  // major — any one is sufficient
  /** Septic shock requiring vasopressors. */
  septicShock: boolean;
  /** Respiratory failure requiring mechanical ventilation. */
  mechanicalVentilation: boolean;

  // minor — three or more
  /** Respiratory rate 30 or more. Same cut point as PSI. */
  tachypnea: boolean;
  /** PaO₂/FiO₂ 250 or less. */
  pafiUnder250: boolean;
  multilobarInfiltrates: boolean;
  /** Confusion or disorientation. Same fact as PSI's altered mental status. */
  confusion: boolean;
  /** BUN 20 mg/dL or more — note PSI scores at 30. */
  uremiaOver20: boolean;
  /** White cells under 4000. */
  leukopenia: boolean;
  /** Platelets under 100,000. */
  thrombocytopenia: boolean;
  /** Core temperature under 36 °C — note PSI scores under 35. */
  hypothermiaUnder36: boolean;
  /** Hypotension requiring aggressive fluid resuscitation. */
  hypotensionNeedingFluids: boolean;
}

export interface CriterionItem {
  key: keyof SevereCapFindings;
  label: string;
  kind: "major" | "minor";
}

export const SEVERE_CAP_MAJOR: CriterionItem[] = [
  { key: "septicShock", label: "Septic shock on vasopressors", kind: "major" },
  { key: "mechanicalVentilation", label: "Needs mechanical ventilation", kind: "major" },
];

export const SEVERE_CAP_MINOR: CriterionItem[] = [
  { key: "tachypnea", label: "Resp rate ≥ 30", kind: "minor" },
  { key: "pafiUnder250", label: "PaO₂/FiO₂ ≤ 250", kind: "minor" },
  { key: "multilobarInfiltrates", label: "Multilobar infiltrates", kind: "minor" },
  { key: "confusion", label: "Confusion", kind: "minor" },
  { key: "uremiaOver20", label: "BUN ≥ 20", kind: "minor" },
  { key: "leukopenia", label: "White cells < 4000", kind: "minor" },
  { key: "thrombocytopenia", label: "Platelets < 100k", kind: "minor" },
  { key: "hypothermiaUnder36", label: "Temp < 36 °C", kind: "minor" },
  { key: "hypotensionNeedingFluids", label: "Hypotension needing fluids", kind: "minor" },
];

export const SEVERE_CAP_ITEMS = [...SEVERE_CAP_MAJOR, ...SEVERE_CAP_MINOR];

export const MINOR_THRESHOLD = 3;

export interface SevereCapResult {
  severe: boolean;
  majorCount: number;
  minorCount: number;
  /** Which limb of the definition was met. */
  metBy: "major" | "minor" | null;
  /** Minor criteria still needed, when no major criterion is present. */
  minorShortfall: number;
}

export function severeCap(f: SevereCapFindings): SevereCapResult {
  const majorCount = SEVERE_CAP_MAJOR.filter((i) => f[i.key]).length;
  const minorCount = SEVERE_CAP_MINOR.filter((i) => f[i.key]).length;

  const metBy =
    majorCount > 0 ? "major" : minorCount >= MINOR_THRESHOLD ? "minor" : null;

  return {
    severe: metBy !== null,
    majorCount,
    minorCount,
    metBy,
    minorShortfall: Math.max(0, MINOR_THRESHOLD - minorCount),
  };
}

/** How to read the criteria, per 10 patients. Rounded from the meta-analysis. */
export const SEVERE_CAP_PERFORMANCE = {
  sensitivity: 0.57,
  specificity: 0.91,
  aucForIcu: "0.65",
  /** Of 10 with severe CAP, how many the criteria catch. */
  caughtPerTen: 6,
  missedPerTen: 4,
};

/* ------------------------------------------------------------------
   Corticosteroids
   ------------------------------------------------------------------ */

export interface SteroidContext {
  severe: boolean;
  /** CAPE-COD excluded influenza; observational data suggest harm. */
  influenza: boolean;
  /** CAPE-COD also excluded septic shock at inclusion. */
  septicShock: boolean;
}

export type SteroidVerdict = "indicated" | "outside-trial" | "not-indicated";

export interface SteroidGuidance {
  verdict: SteroidVerdict;
  regimen: string | null;
  reason: string;
}

export function steroidGuidance(c: SteroidContext): SteroidGuidance {
  if (!c.severe) {
    return {
      verdict: "not-indicated",
      regimen: null,
      reason:
        "The benefit was shown in severe CAP. Below that threshold there is no evidence of gain and the harms still apply.",
    };
  }

  if (c.influenza) {
    return {
      verdict: "outside-trial",
      regimen: null,
      reason:
        "Influenza was excluded from CAPE-COD, and observational data point the other way. This patient sits outside the evidence for benefit.",
    };
  }

  if (c.septicShock) {
    return {
      verdict: "outside-trial",
      regimen: "Hydrocortisone 200 mg/day — but for shock, not for pneumonia",
      reason:
        "Septic shock was excluded from CAPE-COD at inclusion, so the pneumonia evidence does not cover it. Steroids may still be indicated for the shock itself, which is a different question with its own guidance.",
    };
  }

  return {
    verdict: "indicated",
    regimen: "Hydrocortisone 200 mg/day, days 1–4, then taper",
    reason:
      "Start within 24 hours of the first severity criterion. Taper by day 8 or 14 according to response.",
  };
}

/** CAPE-COD, per 100 patients treated. */
export const STEROID_EFFECT = {
  trial: "CAPE-COD, NEJM 2023",
  controlDeathsPerHundred: 12,
  treatedDeathsPerHundred: 6,
  deathsAvertedPerHundred: 6,
  nnt: 18,
};
