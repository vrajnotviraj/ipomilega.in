function relativeAge(from: Date): string {
  const minutes = Math.floor((Date.now() - from.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Tooltip body for SubscriptionCell: QIB/NII/RII breakdown, retail allotment chance, and freshness. */
export default function SubscriptionDetails({
  qib,
  nii,
  rii,
  retailChance,
  provisional,
  freshness,
  captured,
  stale,
}: {
  qib: string | null;
  nii: string | null;
  rii: string | null;
  retailChance?: number | null;
  provisional: boolean;
  freshness: Date | null;
  captured: boolean;
  stale: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 font-mono text-[11px] min-w-[170px]">
      <div className="text-popover-foreground">
        QIB {qib ?? "—"} · NII {nii ?? "—"} · RII {rii ?? "—"}
      </div>

      {typeof retailChance === "number" && (
        <div className="text-popover-foreground/70">
          Retail chance <span className="text-popover-foreground">{retailChance}%</span>
          {provisional && (
            <span
              className="ml-1 text-score-mid"
              title="Bidding is still open. This is 'if bidding closed now' — the book will keep growing, so the real odds will be lower."
            >
              prov.
            </span>
          )}
        </div>
      )}

      {freshness ? (
        <div className={stale ? "text-score-mid" : "text-popover-foreground/70"}>
          {stale ? "⚠ " : ""}
          Updated {relativeAge(freshness)}
          {!captured && " (poll time)"}
        </div>
      ) : (
        <div className="text-popover-foreground/70">Never updated</div>
      )}
    </div>
  );
}
