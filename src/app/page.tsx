import Link from "next/link";
import { Eyebrow } from "@/components/modules/Eyebrow";
import { tools } from "@/tools/registry";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-6 py-10 lg:px-11">
      <header className="flex flex-col gap-4 border-b border-rule pb-8">
        <Eyebrow>Clinical reasoning tools</Eyebrow>
        <h1 className="m-0 max-w-[20ch] text-[34px] font-light leading-tight tracking-[-0.04em] text-balance">
          Tools that fix systematic miscalibration
        </h1>
        <p className="m-0 max-w-[62ch] text-[15px] leading-relaxed text-soft">
          Clinicians are reliably, measurably wrong in specific directions —
          about the probability of disease, about how much a treatment helps,
          about how much it costs. Each tool targets one documented error and
          tries to make itself unnecessary.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group flex flex-col gap-3 border-t border-rule pt-4 no-underline"
          >
            <Eyebrow>{tool.situation}</Eyebrow>
            <h2 className="m-0 text-[19px] font-medium tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">
              {tool.name}
            </h2>
            <p className="m-0 text-[13px] leading-relaxed text-soft">
              {tool.targets}
            </p>
            <p className="m-0 text-[11.5px] text-faint">{tool.scope}</p>
          </Link>
        ))}
      </section>

      <footer className="border-t border-hair pt-6">
        <p className="m-0 max-w-[72ch] text-[11.5px] leading-relaxed text-faint">
          A teaching scaffold, not clinical decision support. Everything runs in
          your browser — there is no server, no account, and nothing you type is
          transmitted or stored anywhere.
        </p>
      </footer>
    </div>
  );
}
