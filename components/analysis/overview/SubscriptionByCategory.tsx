import type { Ipo } from "@/types/ipo";
import { parseGainValue } from "@/lib/ipo/format";
import { Eyebrow } from "@/components/analysis/primitives";

type Row = { label: string; times: number };

const row = (label: string, figure: string | undefined) => ({ label, times: parseGainValue(figure) });

/** Each investor category's subscription multiple, as bars scaled to the most-bid category. */
export function SubscriptionByCategory({ ipo }: { ipo: Ipo }) {
  const hasNiiSplit = ipo.snii_sr || ipo.bnii_sr;
  const rows = [
    row("QIB", ipo.qib_sr),
    ...(hasNiiSplit ? [row("S-HNI", ipo.snii_sr), row("B-HNI", ipo.bnii_sr)] : [row("NII", ipo.nii_sr)]),
    row("Retail", ipo.rii_sr),
    row("Shareholders", ipo.shareholder_sr),
  ].filter((r): r is Row => r.times !== null);
  const total = parseGainValue(ipo.total_sr);
  if (rows.length === 0 || total === null) return null;

  const most = Math.max(...rows.map((r) => r.times), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Eyebrow>Subscription by category</Eyebrow>
        <span className="font-mono text-sm font-medium tabular-nums">
          {total}x <span className="text-xs font-normal text-muted-foreground">total{ipo.subscription_is_provisional ? " so far" : ""}</span>
        </span>
      </div>
      <dl className="reveal-stagger space-y-2.5">
        {rows.map(({ label, times }) => (
          <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
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
