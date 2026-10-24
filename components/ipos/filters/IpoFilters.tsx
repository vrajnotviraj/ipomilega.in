import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import { boardLabel } from "@/lib/ipo/format";
import { VIEWS, sortOptionsOf } from "@/components/ipos/model/views";
import type { BoardCounts, Filters } from "@/components/ipos/model/types";

const BOARD_OPTIONS: Filters["board"][] = ["all", "Mainboard", "SME"];

/** Search box, board tabs with counts and sort menu on one row, then quick filter chips that suit the chosen status. */
export function IpoFilters({ filters, boardCounts, onChange }: { filters: Filters; boardCounts: BoardCounts; onChange: (next: Partial<Filters>) => void }) {
  const d = useT();
  const w = d.ipos.filters;
  const boardOptions = BOARD_OPTIONS.map((value) => ({ value, label: value === "all" ? w.bothBoards : boardLabel(d.common.board, value), count: boardCounts[value] }));
  const sortOptions = sortOptionsOf(filters.status).map((option) => ({
    ...option,
    label: fill(w.sortOption, { column: w.sortBy[option.sort.by], direction: w.direction[option.kind][option.sort.dir] }),
  }));
  // Wide screens sort these tabs from the column titles; phones have no columns, so they keep the menu.
  const columnsSort = filters.status === "Open" || filters.status === "Upcoming" || filters.status === "Closed";
  const toggleQuick = (quick: Filters["quick"]) => onChange({ quick: filters.quick === quick ? null : quick });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <Input
            aria-label={w.search}
            placeholder={w.search}
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            className="h-10 rounded-full bg-card pl-10 text-sm transition-colors hover:border-primary/30"
          />
        </div>
        <SegmentedControl label={w.board} options={boardOptions} value={filters.board} onChange={(board) => onChange({ board })} />
        <div className={cn("relative", columnsSort && "lg:hidden")}>
          <select
            aria-label={w.sort}
            value={`${filters.sort.by}:${filters.sort.dir}`}
            onChange={(e) => onChange({ sort: sortOptions.find((option) => option.key === e.target.value)?.sort })}
            className="h-10 w-full appearance-none rounded-full border border-input bg-card px-4 pr-9 text-sm transition-colors hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring lg:w-[240px]"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
        </div>
      </div>

      <div role="group" aria-label={w.quickFilters} className="flex flex-wrap gap-2">
        {VIEWS[filters.status].quick.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.quick === value}
            onClick={() => toggleQuick(value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium press",
              filters.quick === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {w.quick[value]}
          </button>
        ))}
      </div>
    </div>
  );
}
