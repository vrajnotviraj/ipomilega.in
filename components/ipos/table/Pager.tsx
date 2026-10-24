import { MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/locales";
import { PAGER } from "@/components/ui/pager";
import { isNativeClick } from "@/components/progress/ProgressLink";
import { PAGE_SIZE, ipoPagePath } from "@/components/ipos/model/query";

/** "Showing 1 to 10 of 42" with previous and next links. Links are real /ipos/<n> URLs; a click swaps the page in place and keeps the filters. */
export function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const w = useT().ipos.pager;
  const locale = useLocale();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  const go = (to: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (isNativeClick(e, localePath(locale, ipoPagePath(to)))) return;
    e.preventDefault();
    onPage(to);
  };
  const link = (to: number, rel: "prev" | "next", children: React.ReactNode) =>
    to < 1 || to > pages ? (
      <span aria-disabled="true" className={cn(PAGER, "pointer-events-none opacity-40")}>{children}</span>
    ) : (
      <a href={localePath(locale, ipoPagePath(to))} rel={rel} onClick={go(to)} className={PAGER}>{children}</a>
    );

  return (
    <nav aria-label={w.label} className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {w.showing} <span className="font-mono tabular-nums">{first}</span> {w.to} <span className="font-mono tabular-nums">{last}</span> {w.of}{" "}
        <span className="font-mono tabular-nums">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {link(page - 1, "prev", <><ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> {w.previous}</>)}
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{page} / {pages}</span>
        {link(page + 1, "next", <>{w.next} <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" /></>)}
      </div>
    </nav>
  );
}
