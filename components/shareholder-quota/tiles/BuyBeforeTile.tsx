import { DateRow, DocumentLink, Fact, Foot, QuotaFacts, stageDate, Tile, TileHead } from "@/components/shareholder-quota/tiles/parts";
import { StageTrack } from "@/components/shareholder-quota/tiles/StageTrack";
import { figureFont } from "@/components/shareholder-quota/figureFont";
import { t } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/locales";
import { formatIpoDate, isPastFivePmIst } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo } from "@/lib/queries/shareholder-quota";

/** An IPO whose parent share can still be bought in time: the countdown, the last day to buy, then the bidding dates and figures. */
export function BuyBeforeTile({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const lastDay = formatIpoDate(ipo.lastBuyDate, true);
  const bidding = stageDate(ipo, d);
  return (
    <Tile tone="go">
      <TileHead ipo={ipo} accent link={<DocumentLink ipo={ipo} />}>
        <Countdown ipo={ipo} />
      </TileHead>
      <DateRow date={lastDay ? { label: ipo.lastBuyClosed ? d.lastDayWas : d.lastDay, value: lastDay } : null} />
      <StageTrack stage={ipo.stage} />
      <Foot note={buyingNote(ipo)} adminNote={ipo.note}>
        {bidding && <Fact label={bidding.label}>{bidding.value}</Fact>}
        {ipo.priceBand && <Fact label={common.priceBand}>{ipo.priceBand}</Fact>}
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}

/** What the buyer should know now: bidding has shut, buying is too late, the 3:30 PM cut-off, or what the stage means. */
function buyingNote(ipo: BuyBeforeIpo) {
  const d = t().quota.card;
  if (isPastFivePmIst(ipo.closeDate)) return d.closedNote;
  if (ipo.lastBuyClosed) return d.buyingClosedNote;
  if (ipo.lastBuyDate) return d.buyByNote;
  return d.stageNote[ipo.stage];
}

/** Days left to buy the parent share, in red once it is today or past. */
function Countdown({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const days = ipo.daysToLastBuy;
  if (!ipo.lastBuyDate || days === null) {
    return <p className="mt-3 font-display text-lg font-bold leading-tight text-foreground">{d.countdown.notAnnounced}</p>;
  }
  const text = ipo.lastBuyClosed ? d.countdown.tooLate : days === 0 ? common.today : days === 1 ? common.tomorrow : plural(d.countdown.daysLeft, days);
  const urgent = ipo.lastBuyClosed || days === 0;
  return (
    <p className={cn("mt-3 text-2xl leading-tight tabular-nums sm:text-[28px]", figureFont(text), urgent ? "text-score-bad" : "text-foreground")}>
      {text}
    </p>
  );
}
