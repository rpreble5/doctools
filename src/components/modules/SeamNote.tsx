import type { Seam } from "@/lib/content";
import { Eyebrow } from "./Eyebrow";

/**
 * Where guidelines disagree, shown as a disagreement.
 *
 * An intern who follows one society's guidance and gets pushed back on
 * by an attending concludes they were wrong. Often they were not — they
 * walked into a documented split that no other resource surfaces. This
 * takes no position; both sides stay intact.
 */
export function SeamNote({ seam }: { seam: Seam }) {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow tone="contested">Societies disagree</Eyebrow>

      <p className="m-0 text-[16px] font-medium leading-snug tracking-[-0.02em] text-balance">
        {seam.question}
      </p>

      <div className="flex flex-col gap-4">
        {seam.positions.map((position) => (
          <div key={position.who}>
            <b className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-contested">
              {position.who}
            </b>
            <p className="m-0 text-[13px] leading-relaxed text-soft">
              {position.stance}
            </p>
          </div>
        ))}
      </div>

      {seam.note ? (
        <p className="m-0 max-w-[56ch] text-[11.5px] leading-relaxed text-faint">
          {seam.note}
        </p>
      ) : null}
    </div>
  );
}
