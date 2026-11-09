import { QuotaCard } from "@/components/shareholder-quota/QuotaCard";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

type Props = { id: string; title: string; hint: string; children: React.ReactNode };

/** A titled section of the page; the section chips under the hero link to its id. */
export function QuotaSection({ id, title, hint, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24">
      <h2 id={`${id}-title`} className="type-h2 text-balance">{title}</h2>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{hint}</p>
      {children}
    </section>
  );
}

/** Quota cards on a shared subgrid, so each row of cards lines up. */
export function QuotaGrid({ ipos, highlighted }: { ipos: QuotaIpo[]; highlighted: boolean }) {
  return (
    <ul className="reveal-stagger mt-6 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
      {ipos.map((ipo) => (
        <li key={ipo.id} className="row-span-5 grid grid-rows-subgrid gap-y-0 pb-4">
          <QuotaCard ipo={ipo} highlighted={highlighted} />
        </li>
      ))}
    </ul>
  );
}
