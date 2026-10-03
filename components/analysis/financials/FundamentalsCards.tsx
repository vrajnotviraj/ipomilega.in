import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { formatRupees, parseGainValue, type UseOfProceeds } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { Eyebrow } from "../primitives";

type Fundamentals = IpoComprehensiveAnalysis["fundamentals"];
type Offer = NonNullable<Fundamentals["offer_structure"]>;

/** Total debt as a figure, with the analysis note under it. */
export function DebtCard({ debt }: { debt: NonNullable<Fundamentals["debt"]> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Eyebrow className="mb-1">Debt on the company</Eyebrow>
      <div className="font-mono text-2xl font-medium tabular-nums">{debt.total_debt || "Not stated"}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{debt.summary}</p>
    </div>
  );
}

const chip = "rounded-full border border-border px-2.5 py-0.5 font-mono text-xs tabular-nums";

/** Fresh issue against offer for sale, whether promoters are selling, who sells and why. */
export function OfferStructureCard({ offer }: { offer: Offer }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Eyebrow className="mb-1">Who is selling, and why</Eyebrow>
      <OfferSplit offer={offer} />
      <div className="my-2 flex flex-wrap gap-2">
        {offer.promoters_selling !== null && (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", offer.promoters_selling ? "bg-score-bad/8 text-score-bad" : "bg-score-good/8 text-score-good")}>
            {offer.promoters_selling ? "Promoters selling" : "Promoters not selling"}
          </span>
        )}
      </div>
      {offer.selling_shareholders && offer.selling_shareholders !== "None" && (
        <p className="mb-2 whitespace-pre-wrap text-sm">{offer.selling_shareholders}</p>
      )}
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{offer.why_selling}</p>
    </div>
  );
}

/**
 * How much of the issue goes to the company (fresh issue) and how much to sellers (OFS), as a 100% bar.
 * Falls back to two text chips when either amount can't be read as a number.
 */
function OfferSplit({ offer }: { offer: Offer }) {
  const fresh = parseGainValue(offer.fresh_issue ?? undefined);
  const ofs = parseGainValue(offer.offer_for_sale ?? undefined);
  const total = (fresh ?? 0) + (ofs ?? 0);
  // ponytail: only compares amounts both written in crores; share counts or mixed units fall back to chips.
  const bothInCrores = [offer.fresh_issue, offer.offer_for_sale].every((amount) => /cr/i.test(amount ?? ""));

  if (!bothInCrores || fresh === null || ofs === null || fresh < 0 || ofs < 0 || total === 0) {
    return (
      <div className="my-2 flex flex-wrap gap-2">
        <span className={chip}>Fresh issue: {offer.fresh_issue || "None"}</span>
        <span className={chip}>OFS: {offer.offer_for_sale || "None"}</span>
      </div>
    );
  }

  const freshPercent = Math.round((fresh / total) * 100);
  return (
    <div className="my-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
        <SplitLabel name="Fresh issue" amount={offer.fresh_issue} percent={freshPercent} />
        <SplitLabel name="OFS" amount={offer.offer_for_sale} percent={100 - freshPercent} alignRight />
      </div>
      <div className="flex h-2 gap-0.5" aria-hidden="true">
        {fresh > 0 && <span className="rounded-full bg-chart-1" style={{ width: `${freshPercent}%` }} />}
        {ofs > 0 && <span className="rounded-full bg-chart-5" style={{ width: `${100 - freshPercent}%` }} />}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">Fresh issue goes to the company. OFS goes to the selling shareholders.</p>
    </div>
  );
}

function SplitLabel({ name, amount, percent, alignRight = false }: { name: string; amount: string | null; percent: number; alignRight?: boolean }) {
  return (
    <div className={cn("min-w-0", alignRight && "text-right")}>
      <div className="font-medium">
        {name} <span className="font-mono tabular-nums">{percent}%</span>
      </div>
      <div className="break-words font-mono tabular-nums text-muted-foreground">{amount}</div>
    </div>
  );
}

const crore = (value: number) => `${formatRupees(value)} Cr`;
/** What the company will spend the fresh issue on, item by item, with the OFS called out as money the company never gets. */
export function UseOfProceedsCard({ proceeds }: { proceeds: UseOfProceeds }) {
  const { items, freshCr, ofsCr } = proceeds;
  const ofsOnly = freshCr === 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:col-span-3">
      <Eyebrow className="mb-3">Where the money goes</Eyebrow>
      {ofsOnly ? (
        <p className="text-sm text-pretty">
          This IPO is entirely an offer for sale. The company receives none of the money; it all goes to the selling shareholders.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-sm text-pretty">{item.purpose}</span>
                <span className="shrink-0 text-right font-mono text-sm tabular-nums">
                  {item.amount_cr === null ? <span className="text-muted-foreground">Not stated</span> : crore(item.amount_cr)}
                </span>
              </div>
              {item.percent !== null && (
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true">
                  <span className="block h-full rounded-full bg-chart-1" style={{ width: `${Math.min(item.percent, 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        {!ofsOnly && freshCr !== null && (
          <p>
            Fresh issue <span className="font-mono tabular-nums">{crore(freshCr)}</span>
          </p>
        )}
        {!ofsOnly && items.length > 0 && (ofsCr ?? 0) > 0 && (
          <p className="text-pretty">
            Offer for sale <span className="font-mono tabular-nums">{crore(ofsCr ?? 0)}</span> goes to selling shareholders, not the company.
          </p>
        )}
      </div>
    </div>
  );
}
