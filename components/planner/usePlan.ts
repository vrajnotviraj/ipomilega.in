import { useEffect, useEffectEvent, useState } from "react";
import type { PlannerIpo } from "@/lib/ipo/planner/ipo";
import type { PlanInputs } from "@/lib/ipo/planner/inputs";
import { planIpos, type Goal, type Holders, type Plan } from "@/lib/ipo/planner/plan";

export type PlanRequest = { ipos: PlannerIpo[]; funds: number; accounts: number; goal: Goal; holders: Holders };

const TYPING_PAUSE_MS = 600;

/**
 * The best plan for the request, fetched from the server once the reader has paused typing. The server searches deeply and caches for a day.
 * A newer request cancels the one in flight; if the server fails, the browser does a quick search itself.
 * `working` is true from the first change until the plan arrives.
 */
export function usePlan(request: PlanRequest): { plan: Plan | null; working: boolean } {
  const [answer, setAnswer] = useState<{ plan: Plan; request: PlanRequest } | null>(null);
  const delay = useEffectEvent(() => (answer ? TYPING_PAUSE_MS : 0));

  useEffect(() => {
    const controller = new AbortController();
    const finish = (plan: Plan) => setAnswer({ plan, request });

    const timer = setTimeout(
      async () => {
        const { ipos, ...rest } = request;
        const inputs: PlanInputs = { ...rest, ids: ipos.map((ipo) => ipo.id) };
        try {
          const response = await fetch("/api/planner", { method: "POST", body: JSON.stringify(inputs), signal: controller.signal });
          if (!response.ok) throw new Error(`Planner answered ${response.status}`);
          finish(await response.json());
        } catch {
          if (!controller.signal.aborted) finish(planIpos(ipos, request.funds, request.accounts, request.goal, request.holders));
        }
      },
      delay()
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request]);

  return { plan: answer?.plan ?? null, working: answer?.request !== request };
}
