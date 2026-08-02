export interface CriterionItem {
  label: string;
  met: boolean;
  /** Shown to the right when a value is close enough to be worth seeing. */
  value?: string;
  /** Met but marginal — drawn as an outline rather than a fill. */
  borderline?: boolean;
}

/**
 * A set of yes/no criteria. The dot is the only colored mark; the
 * label stays neutral whatever its state.
 */
export function CriteriaList({
  items,
  columns = 1,
  tone = "scale",
}: {
  items: CriterionItem[];
  columns?: 1 | 2;
  tone?: "scale" | "benefit";
}) {
  const dot = tone === "benefit" ? "bg-benefit" : "bg-scale";
  const ring = tone === "benefit" ? "ring-benefit" : "ring-scale";

  return (
    <ul
      className={`m-0 list-none p-0 ${
        columns === 2
          ? "grid grid-cols-2 content-start gap-x-6 gap-y-[7px]"
          : "flex flex-col gap-[7px]"
      }`}
    >
      {items.map((item) => (
        <li
          key={item.label}
          className={`flex items-center gap-2.5 text-[12.5px] ${
            item.met ? "text-ink" : "text-faint"
          }`}
        >
          <span
            className={`h-[5px] w-[5px] flex-none rounded-full ${
              item.borderline
                ? `bg-transparent ring-[1.5px] ring-inset ${ring}`
                : item.met
                  ? dot
                  : "bg-rule"
            }`}
          />
          {item.label}
          {item.value ? (
            <em
              className={`tnum ml-auto text-[11.5px] not-italic ${
                tone === "benefit" ? "text-benefit" : "text-scale"
              }`}
            >
              {item.value}
            </em>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
