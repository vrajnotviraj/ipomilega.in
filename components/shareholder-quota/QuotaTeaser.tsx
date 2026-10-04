import { ArrowRight } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";

/** The /ipos link to the shareholder-quota page, with how many upcoming IPOs it lists. Hidden when there are none. */
export function QuotaTeaser({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <ProgressLink
      href="/ipos/shareholder-quota"
      className="group press flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:px-5"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-mono text-sm font-medium tabular-nums text-foreground">
        {count}
      </span>
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {count === 1 ? "1 upcoming IPO reserves" : `${count} upcoming IPOs reserve`} shares for the parent&apos;s shareholders.
        </span>{" "}
        See which shares to hold.
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-primary transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-0.5" strokeWidth={2} />
    </ProgressLink>
  );
}
