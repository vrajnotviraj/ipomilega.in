import type { IpoMarketLot } from "@/types/ipo";
import { QuotaDonut } from "./QuotaDonut";

type Slice = { name: string; value: number; color: string };

/** The quota split beside the minimum and maximum application per category. */
export function WhoGetsShares({ slices, applicationRows }: { slices: Slice[]; applicationRows: IpoMarketLot[] }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">Who gets shares</h3>
      <QuotaAndSizes slices={slices} applicationRows={applicationRows} />
    </div>
  );
}

/** The donut beside the application sizes from lg up; the donut alone at a readable width without them. */
function QuotaAndSizes({ slices, applicationRows }: { slices: Slice[]; applicationRows: IpoMarketLot[] }) {
  const donut = (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <QuotaDonut slices={slices} />
    </div>
  );
  if (applicationRows.length === 0) return <div className="max-w-md">{donut}</div>;

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-6">
      {donut}
      <ApplicationSizes rows={applicationRows} />
    </div>
  );
}

/** Application sizes: a table from sm up, stacked rows on phones. */
function ApplicationSizes({ rows }: { rows: IpoMarketLot[] }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground sm:hidden">Application size</div>
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row, index) => (
          <li key={index} className="py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{row.application || "-"}</span>
              <span className="font-mono font-medium tabular-nums">{row.amount || "-"}</span>
            </div>
            <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
              {row.lot_size || "-"} lots, {row.shares || "-"} shares
            </div>
          </li>
        ))}
      </ul>

      <table className="hidden w-full text-sm sm:table">
        <caption className="sr-only">Application size</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            <th scope="col" className="py-3 font-medium">Application</th>
            <th scope="col" className="py-3 text-right font-medium">Lot size</th>
            <th scope="col" className="py-3 text-right font-medium">Shares</th>
            <th scope="col" className="py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="py-2.5 font-sans font-medium">{row.application || "-"}</td>
              <td className="py-2.5 text-right">{row.lot_size || "-"}</td>
              <td className="py-2.5 text-right">{row.shares || "-"}</td>
              <td className="py-2.5 text-right">{row.amount || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
