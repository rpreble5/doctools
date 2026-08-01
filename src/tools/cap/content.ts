import type { Seam, ToolMeta } from "@/lib/content";
import { likelihoodRatios, type Thresholds } from "@/lib/probability";

export const meta: ToolMeta = {
  slug: "cap",
  name: "Community-acquired pneumonia",
  situation: "Suspected pneumonia",
  scope: "Adult, immunocompetent, community-acquired, clinic or emergency department",
  targets:
    "Post-test probability is overestimated, low-risk patients are over-triaged, and roughly four in five courses run longer than indicated.",
  status: "draft",
};

/* ------------------------------------------------------------------
   Diagnosis

   Thresholds are judgement-dependent and adjustable in the tool. The
   defaults below say: under 12% the result would not change what you
   do, over 70% treat regardless. Both are opening positions for the
   attending review, not settled values.
   ------------------------------------------------------------------ */

export const diagnosticThresholds: Thresholds = { test: 0.12, treat: 0.7 };

export interface DiagnosticTest {
  id: string;
  name: string;
  sensitivity: number;
  specificity: number;
  note: string;
  /** Flagged for review — test characteristics vary widely by reference standard. */
  needsReview: boolean;
}

export const diagnosticTests: DiagnosticTest[] = [
  {
    id: "cxr",
    name: "Chest radiograph",
    sensitivity: 0.55,
    specificity: 0.93,
    note: "Against CT as reference standard. Misses more than most people assume.",
    needsReview: true,
  },
  {
    id: "lus",
    name: "Lung ultrasound",
    sensitivity: 0.88,
    specificity: 0.9,
    note: "Elevated as an alternative in the 2025 ATS update. Operator dependent.",
    needsReview: true,
  },
  {
    id: "ct",
    name: "CT chest",
    sensitivity: 0.97,
    specificity: 0.95,
    note: "Reference standard in most diagnostic accuracy studies.",
    needsReview: true,
  },
];

export const testLikelihoodRatios = (test: DiagnosticTest) =>
  likelihoodRatios(test.sensitivity, test.specificity);

/** The calibration gap this panel exists to close. */
export const calibrationGap = {
  claim: "Probability of pneumonia after a positive radiograph",
  clinicianEstimate: "95",
  evidenceRange: [0.46, 0.65] as [number, number],
  evidenceDisplay: "46–65",
  source: "Morgan et al., JAMA Internal Medicine, 2021",
};

/* ------------------------------------------------------------------
   Empiric therapy
   ------------------------------------------------------------------ */

export interface Regimen {
  name: string;
  when: string;
  preferred: boolean;
}

export function regimensFor({
  comorbidities,
  recentAntibiotics,
}: {
  comorbidities: boolean;
  recentAntibiotics: boolean;
}): Regimen[] {
  if (!comorbidities && !recentAntibiotics) {
    return [
      { name: "Amoxicillin", when: "No comorbidity, no recent antibiotics", preferred: true },
      { name: "Doxycycline", when: "Alternative", preferred: false },
      { name: "Macrolide", when: "Only where pneumococcal resistance is low", preferred: false },
    ];
  }

  return [
    {
      name: "Amoxicillin–clavulanate with a macrolide",
      when: recentAntibiotics ? "Recent antibiotics" : "Comorbidity present",
      preferred: true,
    },
    { name: "Respiratory fluoroquinolone", when: "Alternative", preferred: false },
    {
      name: "Cephalosporin with a macrolide",
      when: "Alternative",
      preferred: false,
    },
  ];
}

export const hcapNote =
  "Not HCAP. That category was retired in 2019 — nursing-home residence alone does not broaden coverage. Broaden for documented prior MRSA or Pseudomonas, or recent hospitalisation with parenteral antibiotics.";

/* ------------------------------------------------------------------
   The seam

   IDSA agreed with eight of the ten recommendations in the 2025 ATS
   update, including everything on ultrasound, duration and steroids.
   It declined to endorse over antibacterials in patients with a
   positive viral assay.
   ------------------------------------------------------------------ */

export const viralAssaySeam: Seam = {
  question: "The viral panel is positive. Antibacterials anyway?",
  positions: [
    {
      who: "ATS 2025",
      stance:
        "Start them in ambulatory patients with comorbidities, and in patients admitted to a medical ward.",
    },
    {
      who: "IDSA",
      stance:
        "Declined to endorse. Pneumonia is common, frequently viral and frequently over-diagnosed, so the recommendation licenses a large volume of unnecessary antibiotics and the resistance that follows.",
    },
  ],
  note: "All fifteen independent reviewers from both societies raised concerns about this recommendation. It is genuinely unsettled — worth asking what your service does rather than assuming you were wrong.",
};

/* ------------------------------------------------------------------
   Duration
   ------------------------------------------------------------------ */

export const durationGuidance = {
  minDays: 3,
  maxGuidelineDays: 5,
  lead: "Three to five days for outpatients who reach clinical stability — decided by daily assessment, not fixed when you write the prescription.",
  source: "ATS 2025",
};

export const stabilityCriteria = [
  "Afebrile 48 h",
  "Heart rate under 100",
  "Respiratory rate under 24",
  "Systolic over 90",
  "Saturations 90% or more",
  "Taking oral intake",
];

export const practiceGap = {
  bars: [
    { label: "Right drug", value: 0.8, display: "80%", tone: "benefit" as const },
    { label: "Treated too long", value: 0.798, display: "79.8%", tone: "harm" as const },
  ],
  note: "Median 7.8 days where five was indicated. Almost everyone chooses the drug correctly and the duration incorrectly.",
};

/**
 * Placeholder harm model for the icon array. Shape is right — harm
 * accrues with each day past stability while cure does not — but the
 * magnitude is invented and must not ship as fact.
 */
export const harmPerExtraDay = 3;
export const harmModelIsPlaceholder = true;

/* ------------------------------------------------------------------
   Trajectory
   ------------------------------------------------------------------ */

export const trajectory = [
  {
    when: "48–72 h",
    body: "Reassess. No better is the signal — not no better in twenty-four hours.",
  },
  { when: "3–5 d", body: "Fever and breathlessness clearly improving." },
  {
    when: "4–6 wk",
    body: "Cough and fatigue may persist. Normal, and worth saying out loud before he calls worried.",
  },
  {
    when: "Not routine",
    body: "Repeat radiograph in a patient who is recovering as expected.",
    negative: true,
  },
  {
    when: "Return now",
    body: "Worsening breathlessness, confusion, or unable to keep fluids down.",
    alarm: true,
  },
];
