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

const SME_OFF = "SME: switch on SME IPOs to include";

/** The inputs beside the plan. The plan is worked out again whenever an input changes. */
export function PlannerClient({ ipos, skipped, today }: { ipos: PlannerIpo[]; skipped: SkippedIpo[]; today: number }) {
  const [inputs, setInputs] = useState<PlannerInputs>({ funds: 100000, accounts: 2, goal: "gain", includeSme: false });
  const { funds, accounts, goal, includeSme } = useDeferredValue(inputs);

  const isSme = (ipo: PlannerIpo) => ipo.board === "SME";
  const choosable = useMemo(() => (includeSme ? ipos : ipos.filter((ipo) => !isSme(ipo))), [ipos, includeSme]);
  const plan = useMemo(() => planIpos(choosable, funds, accounts, goal), [choosable, funds, accounts, goal]);
  const cheapestBid = Math.min(...choosable.flatMap((ipo) => ipo.options.map((option) => option.cost)));
  const smeLeftOut = includeSme ? [] : ipos.filter(isSme).map((ipo) => ({ id: ipo.id, name: ipo.name, reason: SME_OFF }));

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <PlannerForm inputs={inputs} onChange={setInputs} />

      <section aria-labelledby="plan-title" aria-live="polite" className="min-w-0">
        <h2 id="plan-title" className="sr-only">Your plan</h2>
        {choosable.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing to plan right now" hint="No open or upcoming IPO has dates, a lot size and a positive GMP yet." />
        ) : plan.applications.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Not enough for one bid" hint={`The cheapest bid right now needs ${formatRupees(cheapestBid)}.`} />
        ) : (
          <>
            <Verdict plan={plan} funds={funds} accounts={accounts} goal={goal} cheapestBid={cheapestBid} />
            <DayByDay applications={plan.applications} funds={funds} today={today} />
            <MoneyTimeline applications={plan.applications} today={today} />
          </>
        )}
        <LeftOut unused={plan.unused} skipped={[...smeLeftOut, ...skipped]} />
        <HowItWorks />
      </section>
    </div>
  );
}
