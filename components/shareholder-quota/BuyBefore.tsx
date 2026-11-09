import { locale, t } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo } from "@/lib/queries/shareholder-quota";

/** The top of a Buy before card: days left to buy the parent and the last day, or that it is not announced yet. */
export function Countdown({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const date = formatIpoDate(ipo.lastBuyDate, true);
  const days = ipo.daysToLastBuy;
  // The deadline is the page's signature: display size, in mono like every figure, closed up so it reads as one figure.
  // DM Mono has no Devanagari or Gujarati, so on hi and gu the words take the display face, untracked.
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
          // Loss colour when the deadline is today or gone, as on the closing-today figures elsewhere.
          date && (ipo.lastBuyClosed || days === 0) ? "text-score-bad" : "text-foreground"
        )}
      >
        {value}
      </p>
      {date && <p className="mt-3 font-mono text-base tabular-nums text-muted-foreground">{date}</p>}
    </div>
  );
}
