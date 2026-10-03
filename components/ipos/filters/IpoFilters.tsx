import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Filters, SORT_OPTIONS, SortKey } from "@/components/ipos/rows";

export type BoardCounts = Record<Filters["board"], number>;

const BOARD_OPTIONS: { value: Filters["board"]; label: string }[] = [
  { value: "all", label: "Both" },
  { value: "Mainboard", label: "Mainboard" },
  { value: "SME", label: "SME" },
];

/** Search box, board tabs with counts and sort menu: one row on desktop, stacked on phones. */
export function IpoFilters({ filters, boardCounts, onChange }: { filters: Filters; boardCounts: BoardCounts; onChange: (next: Partial<Filters>) => void }) {
  const boardOptions = BOARD_OPTIONS.map((option) => ({ ...option, count: boardCounts[option.value] }));
  return (
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
      <div className="relative">
        <select
          aria-label="Sort IPOs"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className="h-10 w-full appearance-none rounded-full border border-input bg-card px-4 pr-9 text-sm transition-colors hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring lg:w-[240px]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
      </div>
    </div>
  );
}
