import type { ReactNode } from "react";

export interface TrajectoryStep {
  when: string;
  body: ReactNode;
  /** Something deliberately not done. Recedes. */
  negative?: boolean;
  /** The one alarm in the tool. Used at most once. */
  alarm?: boolean;
}

/** What happens after the decision, and when to stop expecting it to. */
export function Trajectory({ steps }: { steps: TrajectoryStep[] }) {
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-6 p-0 lg:grid-cols-5">
      {steps.map((step) => (
        <li
          key={step.when}
          className={`flex flex-col gap-1.5 border-t pt-3 ${
            step.alarm
              ? "border-alarm"
              : step.negative
                ? "border-hair"
                : "border-rule"
          }`}
        >
          <span
            className={`tnum font-mono text-[10.5px] tracking-[-0.01em] ${
              step.alarm
                ? "text-alarm"
                : step.negative
                  ? "text-faint"
                  : "text-ink"
            }`}
          >
            {step.when}
          </span>
          <p
            className={`m-0 text-[12.5px] leading-relaxed ${
              step.negative ? "text-faint" : "text-soft"
            }`}
          >
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
