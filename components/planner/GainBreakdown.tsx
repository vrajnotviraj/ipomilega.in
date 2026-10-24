import { formatRupees } from "@/lib/ipo/format";
import type { Application } from "@/lib/ipo/planner/plan";
import { CATEGORY_LABEL, SectionTitle, percent } from "@/components/planner/format";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Where the expected gain comes from: each bid's gain if allotted, times its chance, times the accounts bidding. */
export function GainBreakdown({ applications, expectedGain }: { applications: Application[]; expectedGain: number }) {
  const rows = applications.map((app) => ({ app, expected: app.option.gain * app.option.odds * app.accounts.length }));
  const ifAllAllotted = applications.reduce((sum, app) => sum + app.option.gain * app.accounts.length, 0);

  return (
    <div className="mt-8">
      <SectionTitle>Where the {formatRupees(expectedGain)} comes from</SectionTitle>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        Each bid&apos;s listing gain at today&apos;s GMP, times its chance of allotment. Most lottery bids miss, so the average sits well below the gain if
        every bid lands.
      </p>
      <div className="mt-4 rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {rows.map(({ app, expected }) => (
            <li key={`${app.ipo.id}-${app.option.category}`} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {app.ipo.name} <span className="text-sm font-normal text-muted-foreground">· {CATEGORY_LABEL[app.option.category]}</span>
                </p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatRupees(Math.round(app.option.gain))} if allotted × {percent(app.option.odds)} chance
                  {app.accounts.length > 1 && ` × ${plural(app.accounts.length, "account")}`}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-score-good">+{formatRupees(Math.round(expected))}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-border bg-secondary px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-foreground">Average you can expect</dt>
            <dd className="font-mono font-medium tabular-nums text-score-good">+{formatRupees(expectedGain)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">If every bid is allotted</dt>
            <dd className="font-mono tabular-nums text-muted-foreground">+{formatRupees(Math.round(ifAllAllotted))}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
