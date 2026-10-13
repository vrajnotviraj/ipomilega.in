"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRupees } from "@/lib/ipo-format";
import type { PlannerIpo, SkippedIpo } from "@/lib/ipo-planner/ipo";
import { planIpos } from "@/lib/ipo-planner/plan";
import { PlannerForm, type PlannerInputs } from "@/components/planner/PlannerForm";
import { Verdict } from "@/components/planner/Verdict";
import { DayByDay } from "@/components/planner/DayByDay";
import { MoneyTimeline } from "@/components/planner/MoneyTimeline";
import { LeftOut } from "@/components/planner/LeftOut";
import { HowItWorks } from "@/components/planner/HowItWorks";

/** Why the reader's settings keep this IPO out of the plan, or null when it's in. */
function leftOutReason(ipo: PlannerIpo, { includeSme, excluded }: Pick<PlannerInputs, "includeSme" | "excluded">): string | null {
  if (excluded.includes(ipo.id)) return "You left this out";
  if (!includeSme && ipo.board === "SME") return "SME: switch on SME IPOs to include";
  return null;
}

/** The inputs beside the plan. The plan is worked out again whenever an input changes. */
export function PlannerClient({ ipos, skipped, today }: { ipos: PlannerIpo[]; skipped: SkippedIpo[]; today: number }) {
  const [inputs, setInputs] = useState<PlannerInputs>({ funds: 100000, accounts: 2, goal: "gain", includeSme: false, excluded: [] });
  const { funds, accounts, goal, includeSme, excluded } = useDeferredValue(inputs);

  const choosable = useMemo(() => ipos.filter((ipo) => !leftOutReason(ipo, { includeSme, excluded })), [ipos, includeSme, excluded]);
  const leftOutByYou = ipos.flatMap((ipo) => {
    const reason = leftOutReason(ipo, { includeSme, excluded });
    return reason ? [{ id: ipo.id, name: ipo.name, reason }] : [];
  });
  const plan = useMemo(() => planIpos(choosable, funds, accounts, goal), [choosable, funds, accounts, goal]);
  const cheapestBid = Math.min(...choosable.flatMap((ipo) => ipo.options.map((option) => option.cost)));

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <PlannerForm inputs={inputs} onChange={setInputs} selectable={inputs.includeSme ? ipos : ipos.filter((ipo) => ipo.board !== "SME")} />

      <section aria-labelledby="plan-title" aria-live="polite" className="min-w-0">
        <h2 id="plan-title" className="sr-only">Your plan</h2>
        {ipos.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing to plan right now" hint="No open or upcoming IPO has dates, a lot size and a positive GMP yet." />
        ) : choosable.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Every IPO is left out" hint="Switch on SME IPOs, or untick some IPOs under Advanced." />
        ) : plan.applications.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Not enough for one bid" hint={`The cheapest bid right now needs ${formatRupees(cheapestBid)}.`} />
        ) : (
          <>
            <Verdict plan={plan} funds={funds} accounts={accounts} goal={goal} cheapestBid={cheapestBid} />
            <DayByDay applications={plan.applications} funds={funds} today={today} />
            <MoneyTimeline applications={plan.applications} today={today} />
          </>
        )}
        <LeftOut unused={plan.unused} skipped={[...leftOutByYou, ...skipped]} />
        <HowItWorks />
      </section>
    </div>
  );
}
