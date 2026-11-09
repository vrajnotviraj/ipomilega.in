import { ExternalLink } from "lucide-react";
import { QuotaFigures } from "@/components/shareholder-quota/QuotaCard";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A board-stage rumour as a row: the parent and the source on the left; the figures and the announcement on the right. */
export function RumourCard({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d, rumour: r }, common } = t();
  const announced = ipo.source === "bse" ? formatIpoDate(ipo.announcedOn, true) : null;
  const source = ipo.source === "admin" ? r.fromAdmin : r.fromCompany;
  return (
    <article className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2 sm:py-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance break-words text-foreground sm:text-xl">
          {ipo.parents.map((parent, index) => (
            <span key={parent}>
              {index > 0 && ` ${common.or} `}
              {parent}
            </span>
          ))}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {d.forQuotaIn} <span className="font-medium text-foreground">{ipo.name}</span>
        </p>
        {ipo.note ? (
          <p className="mt-3 text-sm text-pretty text-muted-foreground">{ipo.note}</p>
        ) : (
          !announced && <p className="mt-3 text-sm text-pretty text-muted-foreground">{source}</p>
        )}
      </div>
      <div className="min-w-0">
        <QuotaFigures ipo={ipo} />
        {(announced || ipo.announcementUrl) && (
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            {announced && (
              <dl>
                <dt className="text-xs text-muted-foreground">{r.boardApproved}</dt>
                <dd className="mt-1 whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{announced}</dd>
              </dl>
            )}
            {ipo.announcementUrl && (
              <a
                href={ipo.announcementUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink aria-hidden className="size-4" strokeWidth={2} />
                {r.announcement}
                <span className="sr-only"> {fill(r.announcementFor, { name: ipo.parents.join(", ") })}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** The rumours, newest first, parted by ink hairlines that show on the surface panel. */
export function RumourList({ ipos }: { ipos: QuotaIpo[] }) {
  return (
    <ul className="divide-y divide-primary/15 border-y border-primary/15">
      {ipos.map((ipo) => (
        <li key={ipo.id}>
          <RumourCard ipo={ipo} />
        </li>
      ))}
    </ul>
  );
}
