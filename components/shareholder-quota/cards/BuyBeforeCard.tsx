import { FileText } from "lucide-react";
import { DateRow, Fact, Foot, noteOf, OutLink, QuotaFacts, stageDate, Tile, TileHead } from "@/components/shareholder-quota/cards/parts";
import { StageTrack } from "@/components/shareholder-quota/cards/StageTrack";
import { locale, t } from "@/lib/i18n/server";
import { fill, plural } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo } from "@/lib/queries/shareholder-quota";

/** The Buy before tile: the countdown under the parent, the last day to buy, then bidding, price band, prices, issue and quota. */
export function BuyBeforeCard({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const lastDay = formatIpoDate(ipo.lastBuyDate, true);
  const bidding = stageDate(ipo, d);
  return (
    <Tile tone="go">
      <TileHead ipo={ipo} accent>
        <Countdown ipo={ipo} />
      </TileHead>
      <DateRow date={lastDay ? { label: ipo.lastBuyClosed ? d.lastDayWas : d.lastDay, value: lastDay } : null} />
      <StageTrack stage={ipo.stage} />
      <Foot
        note={noteOf(ipo, d)}
        adminNote={ipo.note}
        links={ipo.documentUrl && <OutLink href={ipo.documentUrl} icon={FileText} label={d.offerDocument} srText={fill(d.documentFor, { name: ipo.name })} />}
      >
        {bidding && <Fact label={bidding.label}>{bidding.value}</Fact>}
        {ipo.priceBand && <Fact label={common.priceBand}>{ipo.priceBand}</Fact>}
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}

/** Days left to buy the parent; "not announced yet" without a date. Red once today or gone. */
function Countdown({ ipo }: { ipo: BuyBeforeIpo }) {
  const { quota: { card: d }, common } = t();
  const days = ipo.daysToLastBuy;
  const known = Boolean(ipo.lastBuyDate) && days !== null;
  // DM Mono has no Devanagari or Gujarati glyphs, so hi and gu use the display face.
  const face = locale() === "en" ? "font-mono font-medium tracking-[-0.03em]" : "font-display font-bold";
  const value = !known
    ? d.countdown.notAnnounced
    : ipo.lastBuyClosed ? d.countdown.tooLate
    : days === 0 ? common.today
    : days === 1 ? common.tomorrow
    : plural(d.countdown.daysLeft, days!);
  return (
    <p
      className={cn(
        "mt-3 leading-tight tabular-nums",
        known ? `${face} text-2xl sm:text-[28px]` : "font-display text-lg font-bold",
        known && (ipo.lastBuyClosed || days === 0) ? "text-score-bad" : "text-foreground"
      )}
    >
      {value}
    </p>
  );
}
