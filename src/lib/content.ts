/**
 * Content model.
 *
 * Deliberately thin. Clinical content lives in typed data rather than
 * inside components so that a tool is mostly content, an attending can
 * review a file without reading React, and a guideline change happens
 * in one place.
 *
 * `tier` is carried but not yet rendered. It exists so the distinction
 * is recorded while content is being written, rather than retrofitted
 * across every tool later. The tier that earns its keep first is
 * `contested` — interns get burned by walking into a documented
 * disagreement and concluding they were wrong.
 */

export type EvidenceTier =
  | "guideline"
  | "evidence"
  | "consensus"
  | "physiology"
  | "contested";

export interface Source {
  label: string;
  year?: number;
  url?: string;
}

export interface Claim {
  text: string;
  /** One line on why this is here. The difference between a checklist and a teacher. */
  why?: string;
  tier: EvidenceTier;
  source?: Source;
}

/** A recommendation two bodies could not agree on, with both positions intact. */
export interface Seam {
  question: string;
  positions: { who: string; stance: string }[];
  note?: string;
}

export interface ToolMeta {
  slug: string;
  name: string;
  /** The situation a clinician is standing in when they open this. */
  situation: string;
  /** What the tool assumes. Knowing you are outside it is part of the framework. */
  scope: string;
  /** The documented error this tool exists to correct. */
  targets: string;
  status: "draft" | "in-review" | "reviewed";
}
