import type { Ipo } from "@/types/ipo";
import { parseGainValue } from "@/lib/ipo-format";
import { Eyebrow } from "./primitives";

/** How many times each investor category has bid for its quota, as bars scaled to the most-bid category. */
export function SubscriptionByCategory({ ipo }: { ipo: Ipo }) {
  const rows = [
    { label: "QIB", times: parseGainValue(ipo.qib_sr) },
    // NSE splits NII into S-HNI and B-HNI; older captures only have the combined figure.
    ...(ipo.snii_sr || ipo.bnii_sr
      ? [{ label: "S-HNI", times: parseGainValue(ipo.snii_sr) }, { label: "B-HNI", times: parseGainValue(ipo.bnii_sr) }]
      : [{ label: "NII", times: parseGainValue(ipo.nii_sr) }]),
    { label: "Retail", times: parseGainValue(ipo.rii_sr) },
  ].filter((row): row is { label: string; times: number } => row.times !== null);
  const total = parseGainValue(ipo.total_sr);
  if (rows.length === 0 || total === null) return null;

  const most = Math.max(...rows.map((row) => row.times), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Eyebrow>Subscription by category</Eyebrow>
        <span className="font-mono text-sm font-medium tabular-nums">
          {total}x <span className="text-xs font-normal text-muted-foreground">total{ipo.subscription_is_provisional ? " so far" : ""}</span>
        </span>
      </div>
      <dl className="space-y-2.5">
        {rows.map(({ label, times }) => (
          <div key={label} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
            <dt className="font-medium">{label}</dt>
            <dd className="h-1.5 rounded-full bg-secondary" aria-hidden="true">
              <span className="block h-full rounded-full bg-chart-1" style={{ width: `${Math.max(2, (times / most) * 100)}%` }} />
            </dd>
            <dd className="text-right font-mono tabular-nums">{times}x</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
