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
  // Bars run from the centre of one day's column to the centre of another's, so they line up with the centred dates.
  const span = (from: number, to: number) => ({ left: `${((from - first + 0.5) / days.length) * 100}%`, width: `${((to - from) / days.length) * 100}%` });
  const grid = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="mt-8">
      <SectionTitle>When your money is blocked</SectionTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        <Swatch className="bg-primary" /> blocked until it comes back
        <Swatch className={cn("ml-3", TAIL)} /> longer if allotted
        <Swatch className="ml-3 bg-secondary" /> weekend
      </p>

      <div className="mt-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          {/* Weekend bands and a hairline down each day's centre, so every bar end visibly lands on its date. */}
          <div aria-hidden className={cn(ROW, "pointer-events-none absolute inset-0")}>
            <div className={cn(CHART, "grid")} style={grid}>
              {days.map((day) => (
                <span key={day} className={cn("flex justify-center", isWeekend(day) && "bg-secondary")}>
                  <span className="w-px bg-border" />
                </span>
              ))}
            </div>
          </div>

          <div className={cn(ROW, "relative border-b border-border")}>
            <div aria-hidden className={cn(CHART, "grid text-center")} style={grid}>
              {days.map((day) => (
                <div key={day} className="flex flex-col items-center gap-0.5 pb-3">
                  <span className="font-mono text-xs text-muted-foreground">{dateOf(day).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}</span>
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full font-mono text-sm font-medium tabular-nums",
                      day === today ? "bg-brand-accent text-foreground" : "bg-card text-foreground"
                    )}
                  >
                    {dateOf(day).getUTCDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ul className="relative space-y-5 pt-4 sm:space-y-4">
            {applications.map(({ ipo, option, accounts }) => (
              <li key={`${ipo.id}-${option.category}`} className={ROW}>
                <div className="min-w-0 justify-self-start bg-card pr-2" title={ipo.name}>
                  <p className="truncate text-sm font-medium text-foreground">{ipo.name}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[option.category]}</p>
                </div>
                <span className="justify-self-end bg-card pl-2 font-mono text-sm font-medium tabular-nums text-foreground sm:col-start-3 sm:row-start-1">
                  {formatRupees(option.cost * accounts.length)}
                </span>
                <div aria-hidden className={cn(CHART, "relative mt-2 h-3.5 sm:row-start-1 sm:mt-0")}>
                  <div className={cn("absolute inset-y-0 rounded-full", TAIL)} style={span(ipo.closeDay, ipo.cashDay)} />
                  <div className="grow-in absolute inset-y-0 rounded-full bg-primary" style={span(ipo.closeDay, ipo.freeDay)} />
                </div>
                <span className="sr-only">
                  Blocked {formatDay(ipo.closeDay)} to {formatDay(ipo.freeDay)}, or to {formatDay(ipo.cashDay)} if allotted.
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Columns shared by the date header, the guides and every row, so they line up: on phones the name and amount sit above a full-width bar
 * (twelve days won't fit beside a name at 360px); from sm the name, bar and amount share one line.
 */
const ROW = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[14rem_minmax(0,1fr)_6rem]";
// Solid, so the hairlines don't show through it; the same look as primary at 20% on the white card.
const TAIL = "bg-[color-mix(in_oklab,var(--primary)_20%,var(--card))]";

const isWeekend = (day: number) => [0, 6].includes(dateOf(day).getUTCDay());
const CHART = "col-span-2 sm:col-span-1 sm:col-start-2";

const Swatch = ({ className }: { className: string }) => <span aria-hidden className={cn("mr-1.5 inline-block h-3 w-5 rounded-full align-middle", className)} />;
