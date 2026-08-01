/**
 * CURB-65 severity score for community-acquired pneumonia.
 *
 * Lim WS et al, Thorax 2003. Site-of-care bands below follow the
 * commonly cited reading; they are guidance for disposition, not a
 * substitute for the judgement about whether someone can manage at
 * home. Awaiting attending review.
 */

export interface Curb65Input {
  /** New disorientation in person, place or time. */
  confusion: boolean;
  /** Blood urea nitrogen > 19 mg/dL (urea > 7 mmol/L). */
  ureaOver7: boolean;
  respiratoryRate: number;
  systolicBp: number;
  diastolicBp: number;
  ageYears: number;
}

export interface Curb65Criterion {
  key: keyof Curb65Input | "bloodPressure";
  label: string;
  met: boolean;
}

export type SiteOfCare = "outpatient" | "consider-admission" | "admit" | "icu";

export interface Curb65Result {
  score: number;
  criteria: Curb65Criterion[];
  siteOfCare: SiteOfCare;
  /** 30-day mortality band associated with the score. */
  mortalityBand: string;
}

export function curb65(input: Curb65Input): Curb65Result {
  const lowBp = input.systolicBp < 90 || input.diastolicBp <= 60;

  const criteria: Curb65Criterion[] = [
    { key: "confusion", label: "Confusion", met: input.confusion },
    { key: "ureaOver7", label: "Urea above 7 mmol/L", met: input.ureaOver7 },
    {
      key: "respiratoryRate",
      label: "Respiratory rate 30 or more",
      met: input.respiratoryRate >= 30,
    },
    {
      key: "bloodPressure",
      label: "Systolic under 90, or diastolic 60 or less",
      met: lowBp,
    },
    { key: "ageYears", label: "Age 65 or over", met: input.ageYears >= 65 },
  ];

  const score = criteria.filter((c) => c.met).length;

  const siteOfCare: SiteOfCare =
    score <= 1 ? "outpatient" : score === 2 ? "consider-admission" : score === 3 ? "admit" : "icu";

  const mortalityBand =
    score === 0
      ? "0.6%"
      : score === 1
        ? "2.7%"
        : score === 2
          ? "6.8%"
          : score === 3
            ? "14%"
            : "27–28%";

  return { score, criteria, siteOfCare, mortalityBand };
}

export const siteOfCareLabel: Record<SiteOfCare, string> = {
  outpatient: "Outpatient",
  "consider-admission": "Consider admission",
  admit: "Admit",
  icu: "Assess for critical care",
};
