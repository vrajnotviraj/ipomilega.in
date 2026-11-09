import { Footer, Heading, Notes, QuotaFigures } from "@/components/shareholder-quota/cards/parts";
import { locale, t } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo } from "@/lib/queries/shareholder-quota";

/** A Buy before card: the countdown, then the parent, the note, the figures and the dates. */
export function BuyBeforeCard({ ipo }: { ipo: BuyBeforeIpo }) {
  return (
    <article className="card-lift rounded-[18px] border border-border bg-card p-5 sm:p-8">
      <Countdown ipo={ipo} />
      <div className="mt-8 border-t border-border pt-8">
        <Heading ipo={ipo} accent />
      </div>
      <div className="mt-4">
        <Notes ipo={ipo} buy={ipo} />
      </div>
      <QuotaFigures ipo={ipo} />
      <Footer ipo={ipo} className="mt-4 border-t border-border pt-3" />
    </article>
  );
}

/** Days left to buy the parent and the last day; "not announced yet" without a date. Red once today or gone. */
function Countdown({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const date = formatIpoDate(ipo.lastBuyDate, true);
  const days = ipo.daysToLastBuy;
  // DM Mono has no Devanagari or Gujarati glyphs, so hi and gu use the display face.
  const big = locale() === "en"
    ? "font-mono text-4xl font-medium tracking-[-0.05em] tabular-nums sm:text-6xl"
    : "font-display text-4xl font-bold tabular-nums sm:text-6xl";
  const value = !date || days === null
    ? d.countdown.notAnnounced
    : ipo.lastBuyClosed ? d.countdown.tooLate
    : days === 0 ? common.today
    : days === 1 ? common.tomorrow
    : plural(d.countdown.daysLeft, days);
  return (
    <div>
      <p className="text-sm text-muted-foreground">{ipo.lastBuyClosed ? d.lastDayWas : d.lastDay}</p>
      <p
        className={cn(
          "mt-2 leading-none",
          date ? big : "font-display text-2xl font-bold tracking-[-0.015em]",
          date && (ipo.lastBuyClosed || days === 0) ? "text-score-bad" : "text-foreground"
        )}
      >
        {value}
      </p>
      {date && <p className="mt-3 font-mono text-base tabular-nums text-muted-foreground">{date}</p>}
    </div>
  );
}
