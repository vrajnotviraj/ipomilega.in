import { ExternalLink } from "lucide-react";
import { QuotaFigures } from "@/components/shareholder-quota/QuotaCard";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A board-stage rumour: a flat, shorter card with only the fields it has, outside the DRHP cards' subgrid. */
export function RumourCard({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d, rumour: r }, common } = t();
  const announced = ipo.source === "bse" ? formatIpoDate(ipo.announcedOn, true) : null;
  const source = ipo.source === "admin" ? r.fromAdmin : r.fromCompany;
  return (
    <article className="rounded-xl bg-secondary p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{d.hold}</p>
      <h3 className="mt-1 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance text-foreground">
        {ipo.parents.map((parent, index) => (
          <span key={parent}>
            {index > 0 && ` ${common.or} `}
            <span className="highlight">{parent}</span>
          </span>
        ))}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {d.forQuotaIn} <span className="font-medium text-foreground">{ipo.name}</span>
      </p>
      <QuotaFigures ipo={ipo} />
      {(announced || ipo.announcementUrl) && (
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2 border-t border-primary/15 pt-3">
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
      {ipo.note ? (
        <p className="mt-3 text-sm text-pretty text-muted-foreground">{ipo.note}</p>
      ) : (
        !announced && <p className="mt-3 text-sm text-pretty text-muted-foreground">{source}</p>
      )}
    </article>
  );
}

/** The rumours, newest first, in their own quieter grid. */
export function RumourList({ ipos }: { ipos: QuotaIpo[] }) {
  return (
    <ul className="reveal-stagger mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ipos.map((ipo) => (
        <li key={ipo.id}>
          <RumourCard ipo={ipo} />
        </li>
      ))}
    </ul>
  );
}
