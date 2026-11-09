import { BuyBeforeCard } from "@/components/shareholder-quota/cards/BuyBeforeCard";
import { QuotaRow } from "@/components/shareholder-quota/cards/QuotaRow";
import { RumourRow } from "@/components/shareholder-quota/cards/RumourRow";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";

type Props = { id: string; title: string; hint: string; quiet?: boolean; children: React.ReactNode };

/** One stage of the list: title and hint on the left, rows on the right. `quiet` puts it on the grey panel. */
export function QuotaSection({ id, title, hint, quiet, children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("mt-24 grid scroll-mt-24 gap-6 sm:mt-32 lg:grid-cols-12 lg:gap-8", quiet && "rounded-[18px] bg-secondary p-5 sm:p-10")}
    >
      <div className="min-w-0 lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <h2 id={`${id}-title`} className="type-h2 text-balance break-words">{title}</h2>
          <p className="mt-4 max-w-[40ch] text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}

/** The Buy before section in the hero: its title, the deadline cards, then its hint as a caption. */
export function BuySection({ title, hint, ipos }: { title: string; hint: string; ipos: BuyBeforeIpo[] }) {
  return (
    <section id="buy" aria-labelledby="buy-title" className="scroll-mt-24">
      <h2 id="buy-title" className="font-display text-2xl font-bold tracking-[-0.015em] text-foreground">{title}</h2>
      <ul className="mt-4 grid gap-4">
        {ipos.map((ipo) => (
          <li key={ipo.id}>
            <BuyBeforeCard ipo={ipo} />
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-[52ch] text-sm text-pretty text-muted-foreground">{hint}</p>
    </section>
  );
}

/** Stage rows parted by hairlines. */
export function QuotaRows({ ipos }: { ipos: QuotaIpo[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {ipos.map((ipo) => (
        <li key={ipo.id}>
          <QuotaRow ipo={ipo} />
        </li>
      ))}
    </ul>
  );
}

/** Rumour rows, parted by darker hairlines that show on the grey panel. */
export function RumourList({ ipos }: { ipos: QuotaIpo[] }) {
  return (
    <ul className="divide-y divide-primary/15 border-y border-primary/15">
      {ipos.map((ipo) => (
        <li key={ipo.id}>
          <RumourRow ipo={ipo} />
        </li>
      ))}
    </ul>
  );
}
