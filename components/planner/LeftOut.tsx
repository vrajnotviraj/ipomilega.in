import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import type { PlannerIpo, SkipReason } from "@/lib/ipo/planner/ipo";
import { SectionTitle } from "@/components/planner/format";

type Row = { id: string; name: string; reason: SkipReason | "excluded" | "sme" | "elsewhere"; gmpPercent?: number };

/** IPOs that got no bid, each with the reason. */
export function LeftOut({ unused, skipped }: { unused: PlannerIpo[]; skipped: Row[] }) {
  const d = useT().planner.leftOut;
  const rows: Row[] = [...unused.map((ipo) => ({ id: ipo.id, name: ipo.name, reason: "elsewhere" as const })), ...skipped];
  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <SectionTitle>{d.title}</SectionTitle>
      <ul className="mt-3 divide-y divide-border rounded-xl bg-secondary px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-sm">
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="text-muted-foreground">{fill(d.reasons[row.reason], { gmp: row.gmpPercent ?? "" })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
