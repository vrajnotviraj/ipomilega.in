"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import { formatRupees } from "@/lib/ipo/format";
import { formatDay } from "@/lib/ipo/planner/days";
import { MAX_ACCOUNTS, MAX_FUNDS } from "@/lib/ipo/planner/inputs";
import type { PlannerIpo } from "@/lib/ipo/planner/ipo";
import type { Goal, Holders } from "@/lib/ipo/planner/plan";

/** `excluded` holds the ids of IPOs the reader keeps out of the plan; `holders` the accounts holding each IPO's parent shares. */
export type PlannerInputs = { funds: number; accounts: number; goal: Goal; includeSme: boolean; excluded: string[]; holders: Holders };

const GOALS: Goal[] = ["gain", "allotments"];

const LABEL = "text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground";
const HINT = "mt-1.5 text-xs text-pretty text-muted-foreground";

/** "1,00,000" to 100000, capped at ₹10 crore. */
const rupeesFrom = (text: string) => Math.min(MAX_FUNDS, Number(text.replace(/\D/g, "")) || 0);

/** Money, accounts, goal, the SME switch and, under Advanced, IPOs to leave out. */
export function PlannerForm({ inputs, onChange, selectable }: { inputs: PlannerInputs; onChange: (inputs: PlannerInputs) => void; selectable: PlannerIpo[] }) {
  const d = useT().planner.form;
  const [fundsText, setFundsText] = useState(inputs.funds.toLocaleString("en-IN"));
  const set = (change: Partial<PlannerInputs>) => onChange({ ...inputs, ...change });

  return (
    <form aria-label={d.label} onSubmit={(event) => event.preventDefault()} className="rounded-[18px] border border-border bg-card p-5 lg:sticky lg:top-24">
      <label htmlFor="funds" className={LABEL}>{d.funds}</label>
      <div className="relative mt-2">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">₹</span>
        <input
          id="funds"
          inputMode="numeric"
          autoComplete="off"
          value={fundsText}
          onChange={(event) => {
            setFundsText(event.target.value.replace(/[^\d,]/g, ""));
            set({ funds: rupeesFrom(event.target.value) });
          }}
          onBlur={() => setFundsText(inputs.funds.toLocaleString("en-IN"))}
          aria-describedby="funds-hint"
          className="h-12 w-full rounded-lg border border-input bg-card pl-8 pr-3 font-mono text-lg tabular-nums text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      <p id="funds-hint" className={HINT}>
        {d.fundsHint}
      </p>

      <div id="accounts-label" className={`mt-6 ${LABEL}`}>{d.accounts}</div>
      <div role="group" aria-labelledby="accounts-label" className="mt-2 flex items-center gap-3">
        <StepButton label={d.oneFewer} disabled={inputs.accounts <= 1} onClick={() => set({ accounts: inputs.accounts - 1 })}>
          <Minus className="size-4" strokeWidth={2.25} />
        </StepButton>
        <output aria-live="polite" className="min-w-10 text-center font-mono text-2xl font-medium tabular-nums text-foreground">{inputs.accounts}</output>
        <StepButton label={d.oneMore} disabled={inputs.accounts >= MAX_ACCOUNTS} onClick={() => set({ accounts: inputs.accounts + 1 })}>
          <Plus className="size-4" strokeWidth={2.25} />
        </StepButton>
      </div>
      <p className={HINT}>{d.accountsHint}</p>

      <div className={`mt-6 ${LABEL}`}>{d.planFor}</div>
      <SegmentedControl
        label={d.planFor}
        options={GOALS.map((value) => ({ value, label: d.goals[value].label }))}
        value={inputs.goal}
        onChange={(goal) => set({ goal })}
        className="mt-2 [&>button]:flex-1"
      />
      <p className={HINT}>{d.goals[inputs.goal].hint}</p>

      <QuotaHolders
        ipos={selectable.filter((ipo) => ipo.quotaParents)}
        accounts={inputs.accounts}
        holders={inputs.holders}
        onChange={(holders) => set({ holders })}
      />

      <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-border pt-5">
        <input type="checkbox" checked={inputs.includeSme} onChange={(event) => set({ includeSme: event.target.checked })} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" />
        <span>
          <span className="block text-sm font-medium text-foreground">{d.includeSme}</span>
          <span className="mt-0.5 block text-xs text-pretty text-muted-foreground">
            {fill(d.smeHint, { amount: formatRupees(200000) })}
          </span>
        </span>
      </label>

      <ExclusionList ipos={selectable} excluded={inputs.excluded} onChange={(excluded) => set({ excluded })} />
    </form>
  );
}

/** For each IPO with a shareholder quota, how many accounts hold the parent company's shares. */
function QuotaHolders({ ipos, accounts, holders, onChange }: { ipos: PlannerIpo[]; accounts: number; holders: Holders; onChange: (holders: Holders) => void }) {
  const { common: c, planner } = useT();
  const d = planner.form;
  if (ipos.length === 0) return null;
  const countOf = (ipo: PlannerIpo) => Math.min(accounts, holders[ipo.id] ?? 0);
  const setCount = (ipo: PlannerIpo, count: number) => onChange({ ...holders, [ipo.id]: count });

  return (
    <fieldset className="mt-6 border-t border-border pt-5">
      <legend className={LABEL}>{c.nav.quota}</legend>
      <p className={HINT}>
        {fill(d.quotaHint, { amount: formatRupees(200000) })}
      </p>
      <ul className="mt-3 space-y-3">
        {ipos.map((ipo) => (
          <li key={ipo.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{ipo.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{ipo.quotaParents?.join(", ") || d.parentCompany}</span>
            </span>
            <span role="group" aria-label={fill(d.holdersFor, { name: ipo.name })} className="flex shrink-0 items-center gap-2">
              <StepButton label={d.oneFewer} disabled={countOf(ipo) <= 0} onClick={() => setCount(ipo, countOf(ipo) - 1)}>
                <Minus className="size-4" strokeWidth={2.25} />
              </StepButton>
              <output aria-live="polite" className="min-w-6 text-center font-mono text-lg font-medium tabular-nums text-foreground">{countOf(ipo)}</output>
              <StepButton label={d.oneMore} disabled={countOf(ipo) >= accounts} onClick={() => setCount(ipo, countOf(ipo) + 1)}>
                <Plus className="size-4" strokeWidth={2.25} />
              </StepButton>
            </span>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** A folded list of the plannable IPOs; ticking one keeps it out of the plan. */
function ExclusionList({ ipos, excluded, onChange }: { ipos: PlannerIpo[]; excluded: string[]; onChange: (excluded: string[]) => void }) {
  const d = useT().planner.form;
  if (ipos.length === 0) return null;
  const toggle = (id: string, leaveOut: boolean) => onChange(leaveOut ? [...excluded, id] : excluded.filter((other) => other !== id));
  const count = ipos.filter((ipo) => excluded.includes(ipo.id)).length;

  return (
    <details className="mt-5 border-t border-border pt-4">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        {d.advanced}
        {count > 0 && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs tabular-nums">{count}</span>}
      </summary>
      <p className={HINT}>{d.advancedHint}</p>
      <ul className="mt-3 space-y-1">
        {ipos.map((ipo) => (
          <li key={ipo.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-secondary">
              <input
                type="checkbox"
                checked={excluded.includes(ipo.id)}
                onChange={(event) => toggle(ipo.id, event.target.checked)}
                className="size-5 shrink-0 cursor-pointer accent-primary"
              />
              <span className="min-w-0 flex-1 py-1.5">
                <span className="block truncate text-sm text-foreground">{ipo.name}</span>
                <span className="block font-mono text-xs tabular-nums text-muted-foreground">
                  <span className="text-score-good">GMP +{ipo.gmpPercent}%</span> · {fill(d.closes, { day: formatDay(ipo.closeDay) })}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </details>
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
