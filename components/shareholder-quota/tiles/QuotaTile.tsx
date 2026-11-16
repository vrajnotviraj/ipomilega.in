import { DateRow, DocumentLink, Fact, Foot, QuotaFacts, stageDate, Tile, TileHead } from "@/components/shareholder-quota/tiles/parts";
import { StageTrack } from "@/components/shareholder-quota/tiles/StageTrack";
import { t } from "@/lib/i18n/server";
import { formatIpoDate, isPastFivePmIst } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A SEBI approved, DRHP filed, closed or listed IPO. Once bidding has shut the tile turns quiet and keeps its old dates. */
export function QuotaTile({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const closed = Boolean(isPastFivePmIst(ipo.closeDate));
  const stage = stageDate(ipo, d);
  const listed = closed && ipo.listingDate ? { label: d.listedOn, value: formatIpoDate(ipo.listingDate, true) ?? "" } : null;
  return (
    <Tile tone={closed ? "quiet" : undefined}>
      <TileHead ipo={ipo} link={<DocumentLink ipo={ipo} />} />
      <DateRow date={listed ?? stage} />
      <StageTrack stage={ipo.stage} />
      <Foot adminNote={ipo.note}>
        {closed && ipo.lastBuyDate && <Fact label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Fact>}
        {listed && stage && <Fact label={stage.label}>{stage.value}</Fact>}
        {closed && ipo.priceBand && <Fact label={common.priceBand}>{ipo.priceBand}</Fact>}
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}
