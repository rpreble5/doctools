import Link from "next/link";
import type { ReactNode } from "react";
import type { ToolMeta } from "@/lib/content";

/**
 * Chrome shared by every tool: a title, the scope, and the disclaimer.
 * Thin on purpose — the canvas belongs entirely to the tool, and the
 * scores now carry the patient state, so the header does not repeat it.
 */
export function ToolFrame({
  meta,
  children,
}: {
  meta: ToolMeta;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-7 px-6 py-6 lg:px-11">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule pb-3">
        <h1 className="m-0 text-[17px] font-medium tracking-[-0.02em]">
          {meta.name}
        </h1>
        <p className="m-0 text-[11.5px] text-faint">{meta.scope}</p>
      </header>

      {/* Every row after the first carries the dividing rule. */}
      <main className="flex flex-col gap-7 [&>*+*]:border-t [&>*+*]:border-hair [&>*+*]:pt-7">
        {children}
      </main>

      <footer className="flex flex-col gap-3 border-t border-hair pt-6">
        <p className="m-0 max-w-[72ch] text-[11.5px] leading-relaxed text-faint">
          A teaching scaffold, not clinical decision support. Nothing you enter
          leaves this device — there is no server and no account. Clinical
          content is {meta.status === "reviewed" ? "reviewed" : "unreviewed"} and
          the scope above is a real boundary, not a formality.
        </p>
        <Link
          href="/"
          className="text-[12px] text-soft underline underline-offset-4 hover:text-ink"
        >
          All tools
        </Link>
      </footer>
    </div>
  );
}
