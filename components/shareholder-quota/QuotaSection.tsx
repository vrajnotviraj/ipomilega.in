import { QuotaCard, QuotaRow } from "@/components/shareholder-quota/QuotaCard";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";

type Props = { id: string; title: string; hint: string; quiet?: boolean; children: React.ReactNode };

/**
 * A stage of the list: the title and hint held on the left while its rows run the rest of the width. Quiet sections
 * (rumours) sit on the surface panel. The section chips under the hero link to its id.
 */
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

/** The Buy before section, set beside the page title in the hero: its title, the deadline cards, then its hint. */
export function BuySection({ title, hint, ipos }: { title: string; hint: string; ipos: BuyBeforeIpo[] }) {
  return (
    <section id="buy" aria-labelledby="buy-title" className="scroll-mt-24">
      <h2 id="buy-title" className="font-display text-2xl font-bold tracking-[-0.015em] text-foreground">{title}</h2>
      <ul className="mt-4 grid gap-4">
        {ipos.map((ipo) => (
          <li key={ipo.id}>
            <QuotaCard ipo={ipo} />
          </li>
        ))}
      </ul>
      {/* The hint as a caption under the cards, so the deadline sits right under its title. */}
      <p className="mt-4 max-w-[52ch] text-sm text-pretty text-muted-foreground">{hint}</p>
    </section>
  );
}

/** Quota rows parted by hairlines. */
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
