import type { ReactNode } from "react";
import { Eyebrow } from "@/components/modules/Eyebrow";

/**
 * A region of a tool. Panels are co-equal — no card, no shadow, no
 * lead. Structure comes from the grid rules around them and from the
 * space inside them.
 */
export function Panel({
  title,
  span = 1,
  aside,
  children,
}: {
  title: string;
  /** Columns to occupy in the tool grid. */
  span?: 1 | 2 | 3;
  /** A control that belongs to the panel, sat on the title line. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const width =
    span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "";

  return (
    <section className={`flex min-w-0 flex-col gap-3.5 ${width}`}>
      {aside ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Eyebrow>{title}</Eyebrow>
          {aside}
        </div>
      ) : (
        <Eyebrow>{title}</Eyebrow>
      )}
      {children}
    </section>
  );
}

/**
 * The grid panels sit in. Dividing rules are applied by the parent in
 * ToolFrame so the first row goes without one — a row cannot know
 * whether it is first, since the header is its sibling.
 */
export function PanelRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">{children}</div>
  );
}
