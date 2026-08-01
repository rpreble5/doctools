import Link from "next/link";
import type { ReactNode } from "react";
import type { ToolMeta } from "@/lib/content";
import { Eyebrow } from "@/components/modules/Eyebrow";

export interface CaseField {
  label: string;
  value: ReactNode;
}

/**
 * Chrome shared by every tool: identity, scope, and the case strip.
 * Thin on purpose — the canvas below belongs entirely to the tool, so
 * a visualisation-led tool can ignore the panel grid completely.
 */
export function ToolFrame({
  meta,
  caseFields,
  children,
}: {
  meta: ToolMeta;
  caseFields?: CaseField[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-10 lg:px-11">
      <header className="flex flex-col gap-6 border-b border-rule pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>{meta.situation}</Eyebrow>
            <h1 className="m-0 text-[23px] font-medium leading-tight tracking-[-0.025em] text-balance">
              {meta.name}
            </h1>
            <p className="m-0 text-[12.5px] text-faint">{meta.scope}</p>
          </div>

          {caseFields?.length ? (
            <dl className="m-0 flex flex-wrap gap-x-6 gap-y-2">
              {caseFields.map((field) => (
                <div key={field.label} className="flex flex-col gap-[3px]">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    {field.label}
                  </dt>
                  <dd className="tnum m-0 font-mono text-[14px] tracking-[-0.02em]">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      {/* Every row after the first carries the dividing rule. */}
      <main className="flex flex-col gap-10 [&>*+*]:border-t [&>*+*]:border-hair [&>*+*]:pt-10">
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
