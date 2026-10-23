import { formatRupees } from "@/lib/ipo/format";
import { formatDay } from "@/lib/ipo/planner/days";
import type { Application } from "@/lib/ipo/planner/plan";
import { BidCard } from "@/components/planner/BidCard";
import { SectionTitle } from "@/components/planner/format";
import { cn } from "@/lib/utils";

/** Each date with something to do: money coming back, bids due, and how much is free after the day. */
export function DayByDay({ applications, funds, today }: { applications: Application[]; funds: number; today: number }) {
  const days = [...new Set(applications.flatMap((app) => [app.ipo.closeDay, app.ipo.freeDay]))].sort((a, b) => a - b);
  const moneyOf = (app: Application) => app.option.cost * app.accounts.length;
  const blockedAfter = (day: number) =>
    applications.reduce((sum, app) => (app.ipo.closeDay <= day && day < app.ipo.freeDay ? sum + moneyOf(app) : sum), 0);

  return (
    <div className="mt-8">
      <SectionTitle>Day by day</SectionTitle>
      <ol className="mt-4">
        {days.map((day) => {
          const due = applications.filter((app) => app.ipo.closeDay === day);
          const back = applications.filter((app) => app.ipo.freeDay === day);
          return (
            <li key={day} className="group relative flex gap-4 pb-6 last:pb-0">
              <span aria-hidden className="absolute bottom-0 left-[7px] top-5 w-px bg-border group-last:hidden" />
              <span aria-hidden className={cn("relative mt-1 size-[15px] shrink-0 rounded-full border-2 border-primary", due.length ? "bg-primary" : "bg-card")} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium tabular-nums text-foreground">{formatDay(day)}</span>
                  {day === today && <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs font-medium text-foreground">Today</span>}
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                    {formatRupees(Math.max(0, funds - blockedAfter(day)))} free after
                  </span>
                </div>
                {back.map((app) => (
                  <p key={`${app.ipo.id}-${app.option.category}`} className="mt-1.5 text-sm text-muted-foreground">
                    <span className="font-mono tabular-nums text-score-good">+{formatRupees(moneyOf(app))}</span> back from {app.ipo.name}, unless
                    allotted
                  </p>
                ))}
                {due.length > 0 && (
                  <ul className="mt-2 space-y-3">
                    {due.map((app) => (
                      <BidCard key={`${app.ipo.id}-${app.option.category}`} app={app} />
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
