import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { IpoTitleLink } from "@/components/ipo-shared/IpoTitleLink";
import { getIpoType } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { Row, Status, hasAnalysis } from "@/components/ipos/rows";

function StatusChip({ status }: { status: Status }) {
  if (status === "Open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-score-bad">
        <span aria-hidden className="size-1.5 rounded-full bg-score-bad" />
        Open
      </span>
    );
  }
  const style = status === "Upcoming" ? "border border-border text-foreground" : "bg-secondary text-muted-foreground";
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", style)}>{status}</span>;
}

/** Logo, name, status chip and board label. */
export function Company({ row }: { row: Row }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IpoLogo src={row.ipo?.image_url} name={row.ipo?.upcoming_ipo_2025} />
      <div className="min-w-0">
        <div className="font-display font-bold tracking-[-0.015em] text-foreground">
          <IpoTitleLink ipo={row.ipo} hasAnalysis={hasAnalysis(row)} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusChip status={row.status} />
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{getIpoType(row.ipo)}</span>
        </div>
      </div>
    </div>
  );
}
