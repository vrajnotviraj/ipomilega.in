import { Eyebrow } from "@/components/analysis/primitives";

type Slice = { name: string; value: number; color: string };

const SIZE = 130;
const CENTER = SIZE / 2;
const RADIUS = 52;
const STROKE = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Gap between slices, in units of ring length.
const GAP = 2;

/** Donut of the QIB, NII and retail quota, with a legend beside it on phones and below it on desktop. */
export function QuotaDonut({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Quota data unavailable.</p>;
  }

  // Each slice is one ring stroke, dashed to its share and started where the slices before it end.
  const shares = slices.map((slice) => slice.value / total);
  const startOf = (index: number) => shares.slice(0, index).reduce((sum, share) => sum + share, 0);

  return (
    <div className="flex h-full flex-col">
      <Eyebrow className="mb-3">Quota split</Eyebrow>
      <div className="flex flex-1 items-center justify-center gap-6 lg:flex-col lg:gap-4">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-hidden="true">
          {slices.map((slice, index) => (
            <circle
              key={slice.name}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(0, shares[index] * CIRCUMFERENCE - GAP)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-startOf(index) * CIRCUMFERENCE}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ))}
        </svg>
        <ul className="space-y-1.5 lg:flex lg:gap-4 lg:space-y-0">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center gap-2 text-sm">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="font-medium">{slice.name}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{slice.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
