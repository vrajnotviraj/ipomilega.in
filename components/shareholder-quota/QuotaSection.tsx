import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuotaCard } from "@/components/shareholder-quota/QuotaCard";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

type Props = { id: string; title: string; hint: string; empty: string; ipos: QuotaIpo[]; highlighted: boolean };

/** A titled grid of quota cards, or an empty state. */
export function QuotaSection({ id, title, hint, empty, ipos, highlighted }: Props) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-12">
      <h2 id={`${id}-title`} className="type-h2 text-balance">{title}</h2>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{hint}</p>
      {ipos.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing here yet" hint={empty} />
      ) : (
        <ul className="reveal-stagger mt-6 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          {ipos.map((ipo) => (
            <li key={ipo.id} className="row-span-4 grid grid-rows-subgrid gap-y-0 pb-4">
              <QuotaCard ipo={ipo} highlighted={highlighted} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
