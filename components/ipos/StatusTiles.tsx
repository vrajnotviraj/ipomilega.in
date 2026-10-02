import { getIpoType, parseEstListingPercent } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { Filters, Row, Step, StepName, matchesStatus, whenText } from "@/components/ipos/rows";

type TileValue = Filters["status"];

const TILES: { value: TileValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Closed", label: "Closed" },
  { value: "Listed", label: "Listed" },
];

/** The dated step nearest ahead (soonest) or most recently passed (latest) among the rows. */
function nearestStep(rows: Row[], step: StepName, pick: "soonest" | "latest") {
  const dated = rows
    .map((row) => row.steps.find((s) => s.name === step))
    .filter((s): s is Step & { days: number } => s?.days != null);
  if (pick === "latest") return dated.sort((a, b) => b.days - a.days)[0];
  return dated.filter((s) => s.days >= 0).sort((a, b) => a.days - b.days)[0];
}

/** One line of context under each count. */
function subtitleFor(value: TileValue, rows: Row[]): string {
  if (value === "all") {
    const sme = rows.filter((row) => getIpoType(row.ipo) === "SME").length;
    return `${rows.length - sme} mainboard, ${sme} SME`;
  }
  if (rows.length === 0) return "None right now";
  if (value === "Open") {
    const days = nearestStep(rows, "Close", "soonest")?.days ?? null;
    if (days === null) return "Close dates to be announced";
    return days > 7 ? `Closing soonest in ${days} days` : `Closing soonest ${whenText(days, "")}`;
  }
  if (value === "Upcoming") {
    const next = nearestStep(rows, "Open", "soonest");
    return next ? `Next opens ${whenText(next.days, next.date)}` : "Dates to be announced";
  }
  if (value === "Closed") return closedSubtitle(rows);
  return listedSubtitle(rows);
}

/** Allotments due today, else the next allotment, else the next listing. */
function closedSubtitle(rows: Row[]): string {
  const allottingToday = rows.filter((row) => row.steps.some((s) => s.name === "Allot" && s.state === "today")).length;
  if (allottingToday > 0) return `${allottingToday} allotment${allottingToday > 1 ? "s" : ""} today`;

  const nextAllot = nearestStep(rows, "Allot", "soonest");
  if (nextAllot) return `Next allotment ${whenText(nextAllot.days, nextAllot.date)}`;

  const nextList = nearestStep(rows, "List", "soonest");
  return nextList ? `Next lists ${whenText(nextList.days, nextList.date)}` : "Listing dates to be announced";
}

/** How many listed above issue price, else when the latest one listed. */
function listedSubtitle(rows: Row[]): string {
  const gains = rows.map((row) => parseEstListingPercent(row.ipo?.listing_gain)).filter((g): g is number => g !== null);
  if (gains.length > 0) return `${gains.filter((g) => g > 0).length} of ${gains.length} listed above issue price`;

  const latest = nearestStep(rows, "List", "latest");
  return latest ? `Latest listed ${latest.date}` : "Listing dates unknown";
}

/** Clickable status tiles, each with its count and one line of context. The active tile is ink. */
export function StatusTiles({ rows, value, onChange }: { rows: Row[]; value: TileValue; onChange: (status: TileValue) => void }) {
  return (
    <div role="group" aria-label="IPO status" className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
      {TILES.map((tile) => {
        const tileRows = rows.filter((row) => matchesStatus(row, tile.value));
        return (
          <Tile
            key={tile.value}
            label={tile.label}
            count={tileRows.length}
            subtitle={subtitleFor(tile.value, tileRows)}
            isLive={tile.value === "Open"}
            isActive={value === tile.value}
            onClick={() => onChange(tile.value)}
            isWide={tile.value === "all"}
          />
        );
      })}
    </div>
  );
}

/** One status button. The wide "All" tile puts its count on the right on phones. */
function Tile({ label, count, subtitle, isLive, isWide, isActive, onClick }: {
  label: string;
  count: number;
  subtitle: string;
  isLive: boolean;
  isWide: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const quietText = isActive ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "grid content-start rounded-xl border p-3 text-left transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4",
        isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary/50",
        isWide && "col-span-2 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:col-span-1 sm:grid-cols-1"
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em]", quietText)}>
        {isLive && <span aria-hidden className={cn("size-1.5 rounded-full", isActive ? "bg-score-bad-on-ink" : "bg-score-bad")} />}
        {label}
      </span>
      <span
        className={cn(
          "mt-1.5 font-mono text-3xl font-medium leading-none tabular-nums",
          isWide && "col-start-2 row-span-2 row-start-1 mt-0 sm:col-start-auto sm:row-span-1 sm:row-start-auto sm:mt-1.5"
        )}
      >
        {count}
      </span>
      <span className={cn("mt-2 text-xs leading-snug", quietText)}>{subtitle}</span>
    </button>
  );
}
