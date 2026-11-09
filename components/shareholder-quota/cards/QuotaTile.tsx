import { FileText } from "lucide-react";
import { DateRow, Fact, Foot, Note, noteOf, OutLink, QuotaFacts, stageDate, Tile, TileHead } from "@/components/shareholder-quota/cards/parts";
import { StageTrack } from "@/components/shareholder-quota/cards/StageTrack";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate, isPastFivePmIst } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A SEBI approved, DRHP filed, bidding closed or listed IPO as a tile. Once bidding has shut it turns quiet and lists its old dates with the figures. */
export function QuotaTile({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const closed = Boolean(isPastFivePmIst(ipo.closeDate));
  const stage = stageDate(ipo, d);
  const listed = closed && ipo.listingDate ? { label: d.listedOn, value: formatIpoDate(ipo.listingDate, true) ?? "" } : null;
  return (
    <Tile tone={closed ? "quiet" : undefined}>
      <TileHead ipo={ipo} />
      <DateRow date={listed ?? stage} />
      <StageTrack stage={ipo.stage} />
      <Note>{noteOf(ipo, null, d)}</Note>
      <Foot
        adminNote={ipo.note}
        links={ipo.documentUrl && <OutLink href={ipo.documentUrl} icon={FileText} label={d.offerDocument} srText={fill(d.documentFor, { name: ipo.name })} />}
      >
        {closed && ipo.lastBuyDate && <Fact label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Fact>}
        {listed && stage && <Fact label={stage.label}>{stage.value}</Fact>}
        {closed && ipo.priceBand && <Fact label={common.priceBand}>{ipo.priceBand}</Fact>}
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}
