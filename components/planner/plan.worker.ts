import { DEEP_SEARCH, planIpos, type PlanRequest } from "@/lib/ipo/planner/plan";

/** Works out the plan off the main thread, so the page stays smooth through a long search. */
self.onmessage = ({ data }: MessageEvent<PlanRequest>) => {
  const { ipos, funds, accounts, goal, holders } = data;
  (self as unknown as Worker).postMessage(planIpos(ipos, funds, accounts, goal, holders, DEEP_SEARCH));
};
