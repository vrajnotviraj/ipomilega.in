import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTON =
  "inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

/** "Showing 1 to 10 of 42" with previous and next buttons. */
export function Pagination({ page, pageSize, total, onPageChange, className }: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3", className)}>
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-mono tabular-nums">{first}</span> to <span className="font-mono tabular-nums">{last}</span> of{" "}
        <span className="font-mono tabular-nums">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className={BUTTON}>
          <ChevronLeft className="size-4" strokeWidth={2} /> Previous
        </button>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{page} / {totalPages}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className={BUTTON}>
          Next <ChevronRight className="size-4" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
