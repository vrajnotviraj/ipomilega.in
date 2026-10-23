import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";
import { quickOptionsOf, sortOptionsOf } from "@/components/ipos/model/views";
import type { BoardCounts, Filters } from "@/components/ipos/model/types";

const BOARD_OPTIONS: { value: Filters["board"]; label: string }[] = [
  { value: "all", label: "Both" },
  { value: "Mainboard", label: "Mainboard" },
  { value: "SME", label: "SME" },
];

/** Search box, board tabs with counts and sort menu on one row, then quick filter chips that suit the chosen status. */
export function IpoFilters({ filters, boardCounts, onChange }: { filters: Filters; boardCounts: BoardCounts; onChange: (next: Partial<Filters>) => void }) {
  const boardOptions = BOARD_OPTIONS.map((option) => ({ ...option, count: boardCounts[option.value] }));
  const sortOptions = sortOptionsOf(filters.status);
  // Wide screens sort these tabs from the column titles; phones have no columns, so they keep the menu.
  const columnsSort = filters.status === "Open" || filters.status === "Upcoming" || filters.status === "Closed";
  const toggleQuick = (quick: Filters["quick"]) => onChange({ quick: filters.quick === quick ? null : quick });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <Input
            aria-label="Search company name"
            placeholder="Search company name"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            className="h-10 rounded-full bg-card pl-10 text-sm transition-colors hover:border-primary/30"
          />
        </div>
        <SegmentedControl label="Board" options={boardOptions} value={filters.board} onChange={(board) => onChange({ board })} />
        <div className={cn("relative", columnsSort && "lg:hidden")}>
          <select
            aria-label="Sort IPOs"
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

      <div role="group" aria-label="Quick filters" className="flex flex-wrap gap-2">
        {quickOptionsOf(filters.status).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.quick === option.value}
            onClick={() => toggleQuick(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium press",
              filters.quick === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
