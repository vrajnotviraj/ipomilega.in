"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CalendarClock, Minus, Plus, TriangleAlert } from "lucide-react";
import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatRupees, getProbabilityColor } from "@/lib/ipo-format";
import { formatDay, planIpos, type Application, type Goal, type Plan, type PlannerIpo, type SkippedIpo } from "@/lib/ipo-planner";
import { cn } from "@/lib/utils";

const MAX_ACCOUNTS = 10;
const MAX_FUNDS = 10_00_00_000; // ₹10 crore
const GOALS: { value: Goal; label: string }[] = [
  { value: "gain", label: "Most profit" },
  { value: "allotments", label: "Most allotments" },
];
const CATEGORY_LABEL = { retail: "Retail", shni: "S-HNI" } as const;

const toNumber = (text: string) => Math.min(MAX_FUNDS, Number(text.replace(/\D/g, "")) || 0);
const percent = (chance: number) => `${chance >= 0.995 ? 100 : chance < 0.01 && chance > 0 ? "<1" : Math.round(chance * 100)}%`;
const oneIn = (odds: number) => (odds >= 1 ? "1 in 1" : `1 in ${Math.round(1 / odds).toLocaleString("en-IN")}`);
/** "Account 2" or "Accounts 1–3". */
const accountRange = (accounts: number[]) =>
  accounts.length === 1 ? `Account ${accounts[0]}` : `Accounts ${accounts[0]}–${accounts[accounts.length - 1]}`;

/** Inputs on the left, the plan on the right; the plan is recomputed as the inputs change. */
export function PlannerClient({ ipos, skipped, today }: { ipos: PlannerIpo[]; skipped: SkippedIpo[]; today: number }) {
  const [fundsText, setFundsText] = useState("1,00,000");
  const [accounts, setAccounts] = useState(2);
  const [goal, setGoal] = useState<Goal>("gain");
  const [includeSme, setIncludeSme] = useState(false);

  const funds = useDeferredValue(toNumber(fundsText));
  const pool = useMemo(() => (includeSme ? ipos : ipos.filter((ipo) => ipo.board !== "SME")), [ipos, includeSme]);
  const plan = useMemo(() => planIpos(pool, funds, accounts, goal), [pool, funds, accounts, goal]);
  const cheapest = Math.min(...pool.flatMap((ipo) => ipo.options.map((option) => option.cost)));
  const smeLeftOut = includeSme ? [] : ipos.filter((ipo) => ipo.board === "SME");

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <form
        aria-label="Your money and accounts"
        onSubmit={(event) => event.preventDefault()}
        className="rounded-[18px] border border-border bg-card p-5 lg:sticky lg:top-24"
      >
        <label htmlFor="funds" className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Money you can block
        </label>
        <div className="relative mt-2">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">₹</span>
          <input
            id="funds"
            inputMode="numeric"
            autoComplete="off"
            value={fundsText}
            onChange={(event) => setFundsText(event.target.value.replace(/[^\d,]/g, ""))}
            onBlur={() => setFundsText(toNumber(fundsText).toLocaleString("en-IN"))}
            aria-describedby="funds-hint"
            className="h-12 w-full rounded-lg border border-input bg-card pl-8 pr-3 font-mono text-lg tabular-nums text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <p id="funds-hint" className="mt-1.5 text-xs text-pretty text-muted-foreground">
          Across all accounts. Move it into each account&apos;s own bank before its bid; IPOs don&apos;t accept a third-party bank account.
        </p>

        <div className="mt-6 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground" id="accounts-label">
          Accounts that can bid
        </div>
        <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby="accounts-label">
          <StepButton label="One account fewer" disabled={accounts <= 1} onClick={() => setAccounts(accounts - 1)}>
            <Minus className="size-4" strokeWidth={2.25} />
          </StepButton>
          <output aria-live="polite" className="min-w-10 text-center font-mono text-2xl font-medium tabular-nums text-foreground">
            {accounts}
          </output>
          <StepButton label="One account more" disabled={accounts >= MAX_ACCOUNTS} onClick={() => setAccounts(accounts + 1)}>
            <Plus className="size-4" strokeWidth={2.25} />
          </StepButton>
        </div>
        <p className="mt-1.5 text-xs text-pretty text-muted-foreground">
          Each with its own PAN, demat and bank, such as a spouse or parent. One PAN bids once per IPO.
        </p>

        <div className="mt-6 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">Plan for</div>
        <SegmentedControl label="Plan for" options={GOALS} value={goal} onChange={setGoal} className="mt-2 [&>button]:flex-1" />
        <p className="mt-1.5 text-xs text-pretty text-muted-foreground">
          {goal === "gain"
            ? "Expected listing gain: your odds times the gain at today's GMP."
            : "The most allotments you can expect, from IPOs with a positive GMP."}
        </p>

        <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-border pt-5">
          <input
            type="checkbox"
            checked={includeSme}
            onChange={(event) => setIncludeSme(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Include SME IPOs</span>
            <span className="mt-0.5 block text-xs text-pretty text-muted-foreground">
              An SME bid needs 2 lots, over {formatRupees(200000)} per account, and SME shares trade thinly after listing.
            </span>
          </span>
        </label>
      </form>

      <section aria-labelledby="plan-title" aria-live="polite" className="min-w-0">
        <h2 id="plan-title" className="sr-only">Your plan</h2>
        {pool.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing to plan right now" hint="No open or upcoming IPO has dates, a lot size and a positive GMP yet. Check back soon." />
        ) : plan.applications.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Not enough for one application"
            hint={`The cheapest application right now needs ${formatRupees(cheapest)}.`}
          />
        ) : (
          <>
            <Verdict plan={plan} funds={funds} accounts={accounts} goal={goal} cheapest={cheapest} />
            <Summary
              stats={[
                { label: goal === "gain" ? "Expected gain" : "Expected allotments", value: goal === "gain" ? formatRupees(plan.expectedGain) : plan.expectedAllotments.toFixed(2) },
                { label: "Chance of 1+ allotment", value: percent(plan.chanceOfAny), color: getProbabilityColor(plan.chanceOfAny * 100) },
                { label: "Most money blocked", value: formatRupees(plan.peakBlocked) },
              ]}
            />
            <DayByDay applications={plan.applications} funds={funds} today={today} />
            <BidList applications={plan.applications} />
            <Timeline applications={plan.applications} today={today} />
          </>
        )}
        <Skipped
          unused={plan.unused}
          skipped={[...smeLeftOut.map((ipo) => ({ id: ipo.id, name: ipo.name, slug: ipo.slug, reason: "SME: switch on SME IPOs to include" })), ...skipped]}
        />
        <Assumptions />
      </section>
    </div>
  );
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground press hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}

/** The plan in one sentence, and what limits it: money or accounts. */
function Verdict({ plan, funds, accounts, goal, cheapest }: { plan: Plan; funds: number; accounts: number; goal: Goal; cheapest: number }) {
  const ipoCount = new Set(plan.applications.map((app) => app.ipo.id)).size;
  const bids = plan.applications.reduce((sum, app) => sum + app.accounts.length, 0);
  const accountsUsed = Math.max(...plan.applications.map((app) => Math.max(...app.accounts)));
  const accountBound = plan.applications.every((app) =>
    plan.applications.filter((other) => other.ipo.id === app.ipo.id).reduce((sum, other) => sum + other.accounts.length, 0) === accounts
  );
  const spare = funds - plan.peakBlocked;
  const limit =
    accountBound && spare >= cheapest
      ? `Accounts are your limit: ${formatRupees(spare)} stays free even on the busiest day. Another family account would add more bids.`
      : plan.unused.length
        ? `Money is your limit: the IPOs left out below would need more on the days their bidding closes.`
        : null;

  return (
    <div className="mb-4 rounded-[18px] bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/70">Your plan</p>
      <p className="mt-2 font-display text-xl font-bold leading-snug tracking-[-0.015em] text-balance sm:text-2xl">
        Place <span className="font-mono tabular-nums">{bids}</span> {bids === 1 ? "bid" : "bids"} across{" "}
        <span className="font-mono tabular-nums">{ipoCount}</span> {ipoCount === 1 ? "IPO" : "IPOs"} from{" "}
        <span className="font-mono tabular-nums">{accountsUsed}</span> {accountsUsed === 1 ? "account" : "accounts"}.{" "}
        {goal === "gain" ? (
          <>
            Expect about <span className="font-mono tabular-nums text-brand-accent">{formatRupees(plan.expectedGain)}</span> in listing gains,
            with a <span className="font-mono tabular-nums">{percent(plan.chanceOfAny)}</span> chance at least one bid is allotted.
          </>
        ) : (
          <>
            Expect about <span className="font-mono tabular-nums text-brand-accent">{plan.expectedAllotments.toFixed(2)}</span> allotments,
            with a <span className="font-mono tabular-nums">{percent(plan.chanceOfAny)}</span> chance of at least one.
          </>
        )}
      </p>
      {limit && <p className="mt-3 text-sm text-pretty text-primary-foreground/80">{limit}</p>}
    </div>
  );
}

/** What to do on each date: bids that are due, money that comes back, and what is free after the day. */
function DayByDay({ applications, funds, today }: { applications: Application[]; funds: number; today: number }) {
  const days = [...new Set(applications.flatMap((app) => [app.ipo.closeDay, app.ipo.freeDay]))].sort((a, b) => a - b);
  const blockedAfter = (day: number) =>
    applications.reduce((sum, app) => (app.ipo.closeDay <= day && day < app.ipo.freeDay ? sum + app.option.cost * app.accounts.length : sum), 0);

  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">Day by day</h3>
      <ol className="mt-4">
        {days.map((day, index) => {
          const bids = applications.filter((app) => app.ipo.closeDay === day);
          const back = applications.filter((app) => app.ipo.freeDay === day);
          const last = index === days.length - 1;
          return (
            <li key={day} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && <span aria-hidden className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />}
              <span
                aria-hidden
                className={cn("relative mt-1 size-[15px] shrink-0 rounded-full border-2", bids.length ? "border-primary bg-primary" : "border-primary bg-card")}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium tabular-nums text-foreground">{formatDay(day)}</span>
                  {day === today && <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs font-medium text-foreground">Today</span>}
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                    {formatRupees(Math.max(0, funds - blockedAfter(day)))} free after
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 text-sm text-pretty text-foreground">
                  {back.map((app) => (
                    <li key={`back-${app.ipo.id}-${app.option.category}`} className="text-muted-foreground">
                      <span className="font-mono tabular-nums text-score-good">+{formatRupees(app.option.cost * app.accounts.length)}</span> back
                      from {app.ipo.name}, unless allotted
                    </li>
                  ))}
                  {bids.map((app) => (
                    <li key={`bid-${app.ipo.id}-${app.option.category}`}>
                      Bid on <span className="font-medium">{app.ipo.name}</span> as {CATEGORY_LABEL[app.option.category]} from{" "}
                      {accountRange(app.accounts).toLowerCase()}{" "}
                      <span className="font-mono tabular-nums text-muted-foreground">
                        ({app.accounts.length} × {formatRupees(app.option.cost)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Summary({ stats }: { stats: { label: string; value: string; color?: string }[] }) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
      {stats.map((stat) => (
        <div key={stat.label} className="px-3 py-3 sm:px-5 sm:py-4">
          <dt className="text-xs leading-tight text-muted-foreground">{stat.label}</dt>
          <dd className={cn("mt-1 font-mono text-base font-medium tabular-nums text-foreground sm:text-xl", stat.color)}>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The bids in the order they are due, each with its accounts, money and dates. */
function BidList({ applications }: { applications: Application[] }) {
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">Your bids</h3>
      <ol className="mt-3 space-y-3">
        {applications.map((app) => {
          const { ipo, option } = app;
          return (
            <li key={`${ipo.id}-${option.category}`} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <IpoLogo src={ipo.logo} name={ipo.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">
                    {ipo.slug ? (
                      <ProgressLink href={`/analysis/${ipo.slug}`} className="underline decoration-dotted decoration-primary/50 underline-offset-4 hover:decoration-solid">
                        {ipo.name}
                      </ProgressLink>
                    ) : (
                      ipo.name
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ipo.board} · GMP <span className="font-mono tabular-nums text-score-good">+{ipo.gmpPercent}%</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium uppercase tracking-[0.04em] text-foreground">
                  {CATEGORY_LABEL[option.category]}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-4">
                <Fact label={accountRange(app.accounts)} value={`${formatRupees(option.cost)} each`} />
                <Fact label={option.estimated ? "Odds (est.)" : "Odds"} value={oneIn(option.odds)} valueClass={getProbabilityColor(option.odds * 100)} />
                <Fact label="Bid by" value={`${formatDay(ipo.closeDay)}, 3 PM`} />
                <Fact label="Money back" value={formatDay(ipo.freeDay)} />
              </dl>

              {app.atRisk && (
                <p className="mt-3 flex gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-pretty text-foreground">
                  <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-score-mid" strokeWidth={2.25} />
                  Uses money an earlier bid frees. If that bid gets allotment, the money stays in shares until listing, so skip this one or
                  add money.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Fact({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono font-medium tabular-nums text-foreground", valueClass)}>{value}</dd>
    </div>
  );
}

/**
 * Money over time: one row per bid, a day per column. The solid bar is money blocked from the bid to its free day,
 * the faint tail how long it stays out if the bid is allotted (until the day after listing).
 */
function Timeline({ applications, today }: { applications: Application[]; today: number }) {
  const start = Math.min(today, ...applications.map((app) => app.ipo.closeDay));
  const end = Math.max(...applications.map((app) => app.ipo.cashDay));
  const days = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const column = (day: number) => day - start + 1;
  const columns = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">When your money is blocked</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="mr-1 inline-block h-2 w-4 rounded-full bg-primary align-middle" aria-hidden /> blocked until it comes back
        <span className="ml-3 mr-1 inline-block h-2 w-4 rounded-full bg-primary/20 align-middle" aria-hidden /> longer if allotted
      </p>

      <div className="mt-3 rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="grid text-center" style={columns} aria-hidden>
          {days.map((day) => (
            <div key={day} className={cn("pb-2 font-mono text-[11px] leading-tight tabular-nums", day === today ? "font-medium text-foreground" : "text-muted-foreground")}>
              <div>{new Date(day * 86_400_000).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}</div>
              <div>{new Date(day * 86_400_000).getUTCDate()}</div>
            </div>
          ))}
        </div>
        <ul className="space-y-2.5 border-t border-border pt-3">
          {applications.map((app) => (
            <li key={`${app.ipo.id}-${app.option.category}`}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">
                  {app.ipo.name} <span className="text-muted-foreground">· {CATEGORY_LABEL[app.option.category]}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                  {formatRupees(app.option.cost * app.accounts.length)}
                </span>
              </div>
              <div className="relative mt-1 grid h-2.5" style={columns}>
                <div className="rounded-full bg-primary/20" style={{ gridColumn: `${column(app.ipo.closeDay)} / ${column(app.ipo.cashDay) + 1}`, gridRow: 1 }} />
                <div className="grow-in rounded-full bg-primary" style={{ gridColumn: `${column(app.ipo.closeDay)} / ${column(app.ipo.freeDay)}`, gridRow: 1 }} />
              </div>
              <span className="sr-only">
                Blocked {formatDay(app.ipo.closeDay)} to {formatDay(app.ipo.freeDay)}, or to {formatDay(app.ipo.cashDay)} if allotted.
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** IPOs left out of the plan, and why. */
function Skipped({ unused, skipped }: { unused: PlannerIpo[]; skipped: SkippedIpo[] }) {
  const rows = [...unused.map((ipo) => ({ id: ipo.id, name: ipo.name, reason: "Your money and accounts do more elsewhere" })), ...skipped];
  if (!rows.length) return null;
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">Left out</h3>
      <ul className="mt-3 divide-y divide-border rounded-xl bg-secondary px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-sm">
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="text-muted-foreground">{row.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Assumptions() {
  return (
    <details className="mt-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">How the plan is worked out</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-pretty">
        <li>Every bid goes in on the last day, so your money stays free as long as possible. Brokers stop taking bids around 3 PM.</li>
        <li>
          Retail and S-HNI winners are drawn by lottery, one minimum application each, so each account bids the minimum. Odds are about 1 in
          the subscription.
        </li>
        <li>
          Until bidding closes, the subscription is estimated from the GMP (past IPOs ran at about 1.2x the GMP % in retail and 4x in
          S-HNI), or the live figure if higher.
        </li>
        <li>
          Money comes back the working day after the refund date (about T+3), and is used again for later IPOs. If a bid is allotted, it
          comes back the day after listing, once you sell.
        </li>
        <li>Exchange holidays are not counted, and dates marked estimated follow the T+3 schedule.</li>
      </ul>
      <p className="mt-3 text-xs">
        GMP is unofficial and changes daily. This plan is an estimate, not investment advice. Investments in the securities market are
        subject to market risks; read the offer document before investing.
      </p>
    </details>
  );
}
