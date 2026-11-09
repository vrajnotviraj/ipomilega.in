import { ExternalLink } from "lucide-react";
import { Figure, Heading, OutLink, QuotaFigures } from "@/components/shareholder-quota/cards/parts";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A board-stage rumour as a row: parent and source; then the figures, the announcement date and its link. */
export function RumourRow({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { rumour: r } } = t();
  const announced = ipo.source === "bse" ? formatIpoDate(ipo.announcedOn, true) : null;
  const source = ipo.source === "admin" ? r.fromAdmin : r.fromCompany;
  const aside = ipo.note || (!announced && source);
  return (
    <article className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2 sm:py-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <Heading ipo={ipo} />
        {aside && <p className="mt-3 text-sm text-pretty text-muted-foreground">{aside}</p>}
      </div>
      <div className="min-w-0">
        <QuotaFigures ipo={ipo} />
        {(announced || ipo.announcementUrl) && (
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            {announced && (
              <dl>
                <Figure label={r.boardApproved}>{announced}</Figure>
              </dl>
            )}
            {ipo.announcementUrl && (
              <OutLink href={ipo.announcementUrl} icon={ExternalLink} label={r.announcement} srText={fill(r.announcementFor, { name: ipo.parents.join(", ") })} />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
