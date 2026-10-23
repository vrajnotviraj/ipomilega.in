import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sort, SortBy } from "@/components/ipos/model/types";

/** A column title that sorts the list on click, with an arrow while active. */
export function SortHeader({ by, sort, onSort, align = "left", children }: {
  by: SortBy;
  sort: Sort;
  onSort: (by: SortBy) => void;
  align?: "left" | "right";
  children: string;
}) {
  const active = sort.by === by;
  const Arrow = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(by)}
      aria-label={`Sort by ${children}`}
      className={cn("inline-flex items-center gap-1 uppercase tracking-[0.04em] hover:text-foreground", active && "text-foreground", align === "right" && "flex-row-reverse")}
    >
      {children}
      {active && <Arrow className="size-3" strokeWidth={2.5} aria-hidden="true" />}
    </button>
  );
}
