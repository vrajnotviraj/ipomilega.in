import { ExternalLink } from "lucide-react";
import { DateRow, Foot, Note, OutLink, QuotaFacts, Tile, TileHead } from "@/components/shareholder-quota/cards/parts";
import { StageTrack } from "@/components/shareholder-quota/cards/StageTrack";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate } from "@/lib/ipo/format";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";

/** A board-stage rumour as a tile: the board approval date (or where the rumour came from), the stage, the figures and the BSE announcement. */
export function RumourTile({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d, rumour: r } } = t();
  const announced = ipo.source === "bse" ? formatIpoDate(ipo.announcedOn, true) : null;
  return (
    <Tile>
      <TileHead ipo={ipo} />
      <DateRow date={announced ? { label: r.boardApproved, value: announced } : null} text={ipo.source === "admin" ? r.fromAdmin : r.fromCompany} />
      <StageTrack stage={ipo.stage} />
      <Note>{d.stageNote.announced}</Note>
      <Foot
        adminNote={ipo.note}
        links={ipo.announcementUrl && (
          <OutLink href={ipo.announcementUrl} icon={ExternalLink} label={r.announcement} srText={fill(r.announcementFor, { name: ipo.parents.join(", ") })} />
        )}
      >
        <QuotaFacts ipo={ipo} />
      </Foot>
    </Tile>
  );
}
