import { BuyBeforeCard } from "@/components/shareholder-quota/cards/BuyBeforeCard";
import { QuotaTile } from "@/components/shareholder-quota/cards/QuotaTile";
import { RumourTile } from "@/components/shareholder-quota/cards/RumourTile";
import { Clamped } from "@/components/shareholder-quota/cards/parts";
import { desktopColumns } from "@/components/shareholder-quota/columns";
import { t } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";

export type Group = { id: "buy"; ipos: BuyBeforeIpo[] } | { id: "approved" | "filed" | "rumoured" | "closed" | "listed"; ipos: QuotaIpo[] };

// Tailwind needs whole class names, so each span is spelled out.
const MD_SPAN = ["", "md:col-span-1", "md:col-span-2"];
const LG_SPAN = ["", "lg:col-span-1", "lg:col-span-2", "lg:col-span-3"];
const XL_SPAN = ["", "xl:col-span-1", "xl:col-span-2", "xl:col-span-3", "xl:col-span-4"];
// Rows a tile takes on the shared grid: head, date row, track, note, foot.
const TILE_ROWS = 5;

/** Every non-empty stage on one grid. Each stage spans as many columns as it has tiles, so small stages share a row, and every tile part sits on a shared row, so tiles line up across stages. */
export function StageGroups({ groups }: { groups: Group[] }) {
  const cols = desktopColumns(groups.map((group) => group.ipos.length));
  return (
    <div className={cn("grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3", cols === 4 && "xl:grid-cols-4")}>
      {groups.map((group) => (
        <StageGroup key={group.id} group={group} xlCols={cols} />
      ))}
    </div>
  );
}

/** One stage: a heading with its count and a one-line hint, then its tiles on the parent grid's columns and rows. */
function StageGroup({ group, xlCols }: { group: Group; xlCols: number }) {
  const { id, ipos } = group;
  const d = t().quota.sections[id];
  const span = (cols: number) => Math.min(ipos.length, cols);
  // Rows the tiles take at a column count; the stage adds one for its heading. Set as variables because they depend on the data.
  const rows = (cols: number) => Math.ceil(ipos.length / cols) * TILE_ROWS;
  const style = {
    "--t": rows(1), "--t-md": rows(2), "--t-lg": rows(3), "--t-xl": rows(xlCols),
    "--g": rows(1) + 1, "--g-md": rows(2) + 1, "--g-lg": rows(3) + 1, "--g-xl": rows(xlCols) + 1,
  } as React.CSSProperties;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      style={style}
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
        {/* One line, so every stage heading takes the same room. */}
        <Clamped text={d.hint} lines="line-clamp-1" className="mt-1 text-sm text-muted-foreground" />
      </div>
      <ul className="col-span-full row-span-(--t) grid grid-cols-subgrid grid-rows-subgrid gap-y-4 md:row-span-(--t-md) lg:row-span-(--t-lg) xl:row-span-(--t-xl)">
        <Tiles group={group} />
      </ul>
    </section>
  );
}

/** The stage's tiles. */
function Tiles({ group }: { group: Group }) {
  if (group.id === "buy") return group.ipos.map((ipo) => <BuyBeforeCard key={ipo.id} ipo={ipo} />);
  const Tile = group.id === "rumoured" ? RumourTile : QuotaTile;
  return group.ipos.map((ipo) => <Tile key={ipo.id} ipo={ipo} />);
}
