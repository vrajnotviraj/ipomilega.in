import { ExternalLink } from "lucide-react";
import { DateRow, Foot, OutLink, QuotaFacts, Tile, TileHead } from "@/components/shareholder-quota/tiles/parts";
import { StageTrack } from "@/components/shareholder-quota/tiles/StageTrack";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A listed company's board has approved an IPO for a group company: when, or where we heard it, with the BSE announcement. */
export function RumourTile({ ipo }: { ipo: QuotaIpo }) {
  const r = t().quota.rumour;
  const announced = ipo.source === "bse" ? formatIpoDate(ipo.announcedOn, true) : null;
  const source = ipo.lapsed ? r.lapsedNote : ipo.source === "bse" ? r.fromCompany : r.fromAdmin;
  const announcement = ipo.announcementUrl && (
    <OutLink href={ipo.announcementUrl} icon={ExternalLink} label={r.announcement} srText={fill(r.announcementFor, { name: ipo.parents.join(", ") })} />
  );
  return (
    <Tile>
      <TileHead ipo={ipo} link={announcement} />
      <DateRow date={announced ? { label: r.boardApproved, value: announced } : null} text={source} />
      <StageTrack stage={ipo.stage} lapsed={ipo.lapsed} />
      <Foot adminNote={ipo.note}>
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}
