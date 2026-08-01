export interface PointsItem {
  label: string;
  points: number;
}

/**
 * What is driving a score, largest contribution first.
 *
 * Seeing the breakdown is most of the education. In PSI, age is usually
 * the largest bar by a distance — which is exactly why the score
 * under-reads a young patient with severe physiology, and you cannot
 * learn that from the total alone.
 */
export function PointsBreakdown({
  items,
  total,
}: {
  items: PointsItem[];
  total: number;
}) {
  const sorted = [...items].sort((a, b) => b.points - a.points);
  const largest = sorted[0]?.points ?? 1;

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(0,1fr)_80px_30px] items-center gap-3"
        >
          <span className="truncate text-[12.5px] text-soft" title={item.label}>
            {item.label}
          </span>
          <span className="block h-[7px] bg-sunk">
            <i
              className="block h-full bg-scale"
              style={{ width: `${Math.max(4, (item.points / largest) * 100)}%` }}
            />
          </span>
          <em className="tnum text-right text-[12px] not-italic text-soft">
            {item.points}
          </em>
        </div>
      ))}

      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_80px_30px] items-center gap-3 border-t border-hair pt-2">
        <span className="text-[12.5px] text-ink">Total</span>
        <span />
        <em className="tnum text-right text-[12px] not-italic text-ink">
          {total}
        </em>
      </div>
    </div>
  );
}
