import { Figure, Footer, Heading, Notes, QuotaFigures, stageDate } from "@/components/shareholder-quota/cards/parts";
import { StageTrack } from "@/components/shareholder-quota/cards/StageTrack";
import { t } from "@/lib/i18n/server";
import { formatIpoDate, isPastFivePmIst } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/**
 * One IPO as a full-width row: parent and note; then the stage track (or, once bidding has shut, the dates that
 * decided eligibility) and the figures; then the dates and the offer document.
 */
export function QuotaRow({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const date = stageDate(ipo, d);
  const closed = isPastFivePmIst(ipo.closeDate);
  return (
    <article className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2 sm:py-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_auto]">
      <div className="min-w-0">
        <Heading ipo={ipo} />
        <div className="mt-3">
          <Notes ipo={ipo} buy={null} />
        </div>
      </div>
      <div className="min-w-0">
        {closed ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            {ipo.lastBuyDate && <Figure label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Figure>}
            {date && <Figure label={date.label}>{date.value}</Figure>}
            {ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
            {ipo.listingDate && <Figure label={d.listedOn}>{formatIpoDate(ipo.listingDate, true)}</Figure>}
          </dl>
        ) : (
          <StageTrack stage={ipo.stage} />
        )}
        <QuotaFigures ipo={ipo} />
      </div>
      <Footer ipo={ipo} className="min-w-0 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:text-right" />
    </article>
  );
}
