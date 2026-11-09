import { t } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo } from "@/lib/queries/shareholder-quota";

/** The top of a Buy before card: days left to buy the parent and the last day, or that it is not announced yet. */
export function Countdown({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const date = formatIpoDate(ipo.lastBuyDate, true);
  const days = ipo.daysToLastBuy;
  const value = !date || days === null
    ? d.countdown.notAnnounced
    : ipo.lastBuyClosed ? d.countdown.tooLate
    : days === 0 ? common.today
    : days === 1 ? common.tomorrow
    : plural(d.countdown.daysLeft, days);
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{ipo.lastBuyClosed ? d.lastDayWas : d.lastDay}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-medium leading-tight",
          date ? "font-mono tabular-nums" : "font-display font-bold tracking-[-0.015em]",
          // Loss colour when the deadline is today or gone, as on the closing-today figures elsewhere.
          date && (ipo.lastBuyClosed || days === 0) ? "text-score-bad" : "text-foreground"
        )}
      >
        {value}
      </p>
      {date && <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">{date}</p>}
    </div>
  );
}
