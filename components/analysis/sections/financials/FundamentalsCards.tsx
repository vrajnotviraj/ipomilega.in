import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { parseGainValue } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/analysis/primitives";
import { t } from "@/lib/i18n/server";

type Fundamentals = IpoComprehensiveAnalysis["fundamentals"];
type Offer = NonNullable<Fundamentals["offer_structure"]>;

/** Total debt in big figures when it is a short amount, as a plain sentence when it is longer, with the analysis note under it. */
export function DebtCard({ debt }: { debt: NonNullable<Fundamentals["debt"]> }) {
  const d = t().analysis;
  const total = debt.total_debt || d.notStated;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Eyebrow className="mb-1">{d.financials.debt}</Eyebrow>
      <div className={total.length <= 24 ? "font-mono text-2xl font-medium tabular-nums" : "text-pretty text-lg font-medium"}>{total}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{debt.summary}</p>
    </div>
  );
}

const chip = "rounded-full border border-border px-2.5 py-0.5 font-mono text-xs tabular-nums";

/** Fresh issue against offer for sale, whether promoters are selling, who sells and why. */
export function OfferStructureCard({ offer }: { offer: Offer }) {
  const d = t().analysis.financials;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Eyebrow className="mb-1">{d.whoIsSelling}</Eyebrow>
      <OfferSplit offer={offer} />
      <div className="my-2 flex flex-wrap gap-2">
        {offer.promoters_selling !== null && (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", offer.promoters_selling ? "bg-score-bad/8 text-score-bad" : "bg-score-good/8 text-score-good")}>
            {offer.promoters_selling ? d.promotersSelling : d.promotersNotSelling}
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
  const d = t().analysis;
  const fresh = parseGainValue(offer.fresh_issue ?? undefined);
  const ofs = parseGainValue(offer.offer_for_sale ?? undefined);
  const total = (fresh ?? 0) + (ofs ?? 0);
  // ponytail: only compares amounts both written in crores; share counts or mixed units fall back to chips.
  const bothInCrores = [offer.fresh_issue, offer.offer_for_sale].every((amount) => /cr/i.test(amount ?? ""));

  if (!bothInCrores || fresh === null || ofs === null || fresh < 0 || ofs < 0 || total === 0) {
    return (
      <div className="my-2 flex flex-wrap gap-2">
        <span className={chip}>{d.freshIssue}: {offer.fresh_issue || d.financials.none}</span>
        <span className={chip}>OFS: {offer.offer_for_sale || d.financials.none}</span>
      </div>
    );
  }

  const freshPercent = Math.round((fresh / total) * 100);
  return (
    <div className="my-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
        <SplitLabel name={d.freshIssue} amount={offer.fresh_issue} percent={freshPercent} />
        <SplitLabel name="OFS" amount={offer.offer_for_sale} percent={100 - freshPercent} alignRight />
      </div>
      <div className="flex h-2 gap-0.5" aria-hidden="true">
        {fresh > 0 && <span className="rounded-full bg-chart-1" style={{ width: `${freshPercent}%` }} />}
        {ofs > 0 && <span className="rounded-full bg-chart-5" style={{ width: `${100 - freshPercent}%` }} />}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{d.financials.freshVsOfs}</p>
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
