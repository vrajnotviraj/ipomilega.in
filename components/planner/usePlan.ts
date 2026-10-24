import { useEffect, useState } from "react";
import { planIpos, type Plan, type PlanRequest } from "@/lib/ipo/planner/plan";

const TYPING_PAUSE_MS = 600;

/**
 * The best plan for the request, searched deeply in a worker once the reader has paused typing.
 * A newer request cancels the one still running. `working` is true from the first change until the plan arrives.
 */
export function usePlan(request: PlanRequest): { plan: Plan | null; working: boolean } {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [working, setWorking] = useState(true);

  useEffect(() => {
    setWorking(true);
    let worker: Worker | undefined;
    const finish = (found: Plan) => {
      setPlan(found);
      setWorking(false);
      worker?.terminate();
    };

    const timer = setTimeout(
      () => {
        worker = new Worker(new URL("./plan.worker.ts", import.meta.url));
        worker.onmessage = (event: MessageEvent<Plan>) => finish(event.data);
        worker.onerror = () => finish(planIpos(request.ipos, request.funds, request.accounts, request.goal, request.holders));
        worker.postMessage(request);
      },
      plan ? TYPING_PAUSE_MS : 0
    );
    return () => {
      clearTimeout(timer);
      worker?.terminate();
    };
    // `plan` only decides the first delay; a result arriving must not restart the search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  return { plan, working };
}
