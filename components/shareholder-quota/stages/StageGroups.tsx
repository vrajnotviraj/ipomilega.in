import { BuyBeforeTile } from "@/components/shareholder-quota/tiles/BuyBeforeTile";
import { QuotaTile } from "@/components/shareholder-quota/tiles/QuotaTile";
import { RumourTile } from "@/components/shareholder-quota/tiles/RumourTile";
import { TILE_ROWS } from "@/components/shareholder-quota/tiles/parts";
import { desktopColumns } from "@/components/shareholder-quota/stages/columns";
import { t } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";

export type Group = { id: "buy"; ipos: BuyBeforeIpo[] } | { id: "approved" | "filed" | "rumoured" | "closed" | "listed"; ipos: QuotaIpo[] };

// Tailwind only finds whole class names, so each span is written out.
const MD_SPAN = ["", "md:col-span-1", "md:col-span-2"];
const LG_SPAN = ["", "lg:col-span-1", "lg:col-span-2", "lg:col-span-3"];
const XL_SPAN = ["", "xl:col-span-1", "xl:col-span-2", "xl:col-span-3", "xl:col-span-4"];

/** All stages on one grid. A stage spans as many columns as it has tiles, so small stages share a row and their tiles line up. */
export function StageGroups({ groups }: { groups: Group[] }) {
  const xlCols = desktopColumns(groups.map((group) => group.ipos.length));
  return (
    <div className={cn("grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3", xlCols === 4 && "xl:grid-cols-4")}>
      {groups.map((group) => (
        <StageGroup key={group.id} group={group} xlCols={xlCols} />
      ))}
    </div>
  );
}

/** One stage: its heading, count and hint, then its tiles. */
function StageGroup({ group, xlCols }: { group: Group; xlCols: number }) {
  const { id, ipos } = group;
  const d = t().quota.sections[id];
  const span = (cols: number) => Math.min(ipos.length, cols);
  const tileRows = (cols: number) => Math.ceil(ipos.length / cols) * TILE_ROWS;
  const rows = {
    "--t": tileRows(1), "--t-md": tileRows(2), "--t-lg": tileRows(3), "--t-xl": tileRows(xlCols),
    "--g": tileRows(1) + 1, "--g-md": tileRows(2) + 1, "--g-lg": tileRows(3) + 1, "--g-xl": tileRows(xlCols) + 1,
  } as React.CSSProperties;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      style={rows}
      className={cn(
        "row-span-(--g) grid scroll-mt-24 grid-cols-subgrid grid-rows-subgrid gap-y-3 md:row-span-(--g-md) lg:row-span-(--g-lg) xl:row-span-(--g-xl)",
        MD_SPAN[span(2)], LG_SPAN[span(3)], XL_SPAN[span(xlCols)]
      )}
    >
      <div className="col-span-full min-w-0 self-end">
        <h2 id={`${id}-title`} className="flex items-baseline gap-2 font-display text-lg font-bold tracking-[-0.015em] text-foreground sm:text-xl">
          {d.title}
          <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">{ipos.length}</span>
        </h2>
        <OneLine text={d.hint} className="mt-1 text-sm text-muted-foreground" />
      </div>
      <ul className="col-span-full row-span-(--t) grid grid-cols-subgrid grid-rows-subgrid gap-y-4 md:row-span-(--t-md) lg:row-span-(--t-lg) xl:row-span-(--t-xl)">
        <Tiles group={group} />
      </ul>
    </section>
  );
}

/** The tile that suits each stage. */
function Tiles({ group }: { group: Group }) {
  if (group.id === "buy") return group.ipos.map((ipo) => <BuyBeforeTile key={ipo.id} ipo={ipo} />);
  const Tile = group.id === "rumoured" ? RumourTile : QuotaTile;
  return group.ipos.map((ipo) => <Tile key={ipo.id} ipo={ipo} />);
}

/** Text cut to one line on screen, in full in the tooltip and for screen readers. */
function OneLine({ text, className }: { text: string; className: string }) {
  return (
    <p title={text} className={className}>
      <span aria-hidden className="line-clamp-1">{text}</span>
      <span className="sr-only">{text}</span>
    </p>
  );
}
