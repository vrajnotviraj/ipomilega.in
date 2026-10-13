import type { PlannerIpo, SkippedIpo } from "@/lib/ipo-planner/ipo";
import { SectionTitle } from "@/components/planner/format";

const DID_MORE_ELSEWHERE = "Your money and accounts do more elsewhere";

/** IPOs that got no bid, each with the reason. */
export function LeftOut({ unused, skipped }: { unused: PlannerIpo[]; skipped: SkippedIpo[] }) {
  const rows = [...unused.map((ipo) => ({ id: ipo.id, name: ipo.name, reason: DID_MORE_ELSEWHERE })), ...skipped];
  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <SectionTitle>Left out</SectionTitle>
      <ul className="mt-3 divide-y divide-border rounded-xl bg-secondary px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-sm">
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="text-muted-foreground">{row.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
