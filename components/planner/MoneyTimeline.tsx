import { formatRupees } from "@/lib/ipo/format";
import { dateOf, formatDay } from "@/lib/ipo/planner/days";
import type { Application } from "@/lib/ipo/planner/plan";
import { CATEGORY_LABEL, SectionTitle } from "@/components/planner/format";
import { cn } from "@/lib/utils";

/**
 * One bar per bid over a day-by-day axis. The solid part is money blocked until it comes back;
 * the faint tail is how long it stays out if the bid is allotted.
 */
export function MoneyTimeline({ applications, today }: { applications: Application[]; today: number }) {
  const first = Math.min(today, ...applications.map((app) => app.ipo.closeDay));
  const last = Math.max(...applications.map((app) => app.ipo.cashDay));
  const days = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const column = (day: number) => day - first + 1;
  const grid = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="mt-8">
      <SectionTitle>When your money is blocked</SectionTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        <Swatch className="bg-primary" /> blocked until it comes back
        <Swatch className="ml-3 bg-primary/20" /> longer if allotted
      </p>

      <div className="mt-3 rounded-xl border border-border bg-card p-3 sm:p-4">
        <div aria-hidden className="grid text-center" style={grid}>
          {days.map((day) => (
            <div key={day} className={cn("pb-2 font-mono text-[11px] leading-tight tabular-nums", day === today ? "font-medium text-foreground" : "text-muted-foreground")}>
              <div>{dateOf(day).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}</div>
              <div>{dateOf(day).getUTCDate()}</div>
            </div>
          ))}
        </div>
        <ul className="space-y-2.5 border-t border-border pt-3">
          {applications.map(({ ipo, option, accounts }) => (
            <li key={`${ipo.id}-${option.category}`}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">
                  {ipo.name} <span className="text-muted-foreground">· {CATEGORY_LABEL[option.category]}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatRupees(option.cost * accounts.length)}</span>
              </div>
              <div aria-hidden className="mt-1 grid h-2.5" style={grid}>
                <div className="row-start-1 rounded-full bg-primary/20" style={{ gridColumn: `${column(ipo.closeDay)} / ${column(ipo.cashDay) + 1}` }} />
                <div className="grow-in row-start-1 rounded-full bg-primary" style={{ gridColumn: `${column(ipo.closeDay)} / ${column(ipo.freeDay)}` }} />
              </div>
              <span className="sr-only">
                Blocked {formatDay(ipo.closeDay)} to {formatDay(ipo.freeDay)}, or to {formatDay(ipo.cashDay)} if allotted.
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const Swatch = ({ className }: { className: string }) => <span aria-hidden className={cn("mr-1 inline-block h-2 w-4 rounded-full align-middle", className)} />;
