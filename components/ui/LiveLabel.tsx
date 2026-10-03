import { cn } from "@/lib/utils";

/** The live badge: a rippling red dot and the LIVE label. */
export function LiveLabel({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-[0.04em] text-score-bad", className)}>
      <span className="pulse-ring relative inline-block size-1.5 shrink-0 rounded-full bg-score-bad" aria-hidden="true" />
      Live
    </span>
  );
}
