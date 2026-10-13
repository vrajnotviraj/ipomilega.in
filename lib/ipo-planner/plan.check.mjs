// Self-check for the IPO planner. Run with: node lib/ipo-planner/plan.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." imports to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { addWorkingDays, dateOf } = await import("./days.ts");
const { toPlannerIpo, isSkipped } = await import("./ipo.ts");
const { planIpos } = await import("./plan.ts");

const THU = 20741; // Thu 15 Oct 2026
assert.equal(dateOf(THU).toISOString().slice(0, 10), "2026-10-15");
assert.equal(addWorkingDays(THU, 2), THU + 4, "T+2 from a Thursday skips the weekend");

const ipo = (id, close, { cost = 15000, odds = 0.1, gain = 6000, shni, free = addWorkingDays(close, 3) } = {}) => ({
  id, name: id, slug: null, logo: null, board: "Mainboard", gmpPercent: 40, closeDay: close, freeDay: free, cashDay: addWorkingDays(free, 1),
  options: [{ category: "retail", cost, odds, gain, estimated: false }, ...(shni ? [shni] : [])],
});
const accountsOn = (plan, id) => plan.applications.filter((app) => app.ipo.id === id).reduce((n, app) => n + app.accounts.length, 0);

// Money A frees pays for B when B closes on A's free day or later.
{
  const plan = planIpos([ipo("A", THU), ipo("B", addWorkingDays(THU, 3))], 15000, 1, "gain");
  assert.deepEqual([accountsOn(plan, "A"), accountsOn(plan, "B")], [1, 1], "reuses freed money");
  assert.equal(plan.applications[1].atRisk, true, "an allotment in A leaves no money for B");
}
// B closes before A's money is back: only the better of the two.
{
  const plan = planIpos([ipo("A", THU), ipo("B", addWorkingDays(THU, 2), { gain: 9000 })], 15000, 1, "gain");
  assert.deepEqual([accountsOn(plan, "A"), accountsOn(plan, "B")], [0, 1]);
}
// One bid per account per IPO; spare money goes to S-HNI.
{
  const shni = { category: "shni", cost: 210000, odds: 0.02, gain: 84000, estimated: false };
  const plan = planIpos([ipo("A", THU, { shni })], 300000, 2, "gain");
  assert.deepEqual(plan.applications.map((app) => [app.option.category, app.accounts]), [["shni", [2]], ["retail", [1]]]);
  assert.equal(plan.peakBlocked, 225000);
}
// The goal decides between a big gain and good odds.
{
  const rich = ipo("rich", THU, { odds: 0.05, gain: 20000 }), easy = ipo("easy", THU, { odds: 0.5, gain: 500 });
  assert.equal(planIpos([rich, easy], 15000, 1, "gain").applications[0].ipo.id, "rich");
  assert.equal(planIpos([rich, easy], 15000, 1, "allotments").applications[0].ipo.id, "easy");
  assert.ok(Math.abs(planIpos([rich, easy], 30000, 1, "gain").chanceOfAny - (1 - 0.95 * 0.5)) < 1e-9);
}
assert.equal(planIpos([ipo("A", THU)], 1000, 3, "gain").applications.length, 0, "too little money gives an empty plan");

// Matches brute force on random calendars.
let seed = 11;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const randomIpo = (id, close) => {
  const sub = 1 + rand() * 80;
  const shni = rand() < 0.6 ? { category: "shni", cost: 205000 + rand() * 9000, odds: 1 / (sub * 3), gain: 60000 * rand(), estimated: false } : undefined;
  return ipo(id, close, { cost: 14000 + rand() * 1000, odds: 1 / sub, gain: 8000 * rand(), shni });
};
for (let run = 0; run < 300; run++) {
  const ipos = Array.from({ length: 2 + (run % 3) }, (_, i) => randomIpo(`I${i}`, THU + Math.floor(rand() * 8)));
  const funds = [30000, 60000, 250000, 450000][run % 4], accounts = 1 + (run % 3);
  const worth = (counts) => counts.reduce((sum, c, i) => sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].odds * ipos[i].options[k].gain, 0), 0);
  const blockedOn = (counts, day) => counts.reduce((sum, c, i) => (ipos[i].closeDay <= day && day < ipos[i].freeDay ? sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].cost, 0) : sum), 0);
  let best = 0;
  (function tryAll(i, counts) {
    if (i === ipos.length) {
      if (ipos.every((at) => blockedOn(counts, at.closeDay) <= funds)) best = Math.max(best, worth(counts));
      return;
    }
    for (let r = 0; r <= accounts; r++) for (let s = 0; s <= (ipos[i].options.length > 1 ? accounts - r : 0); s++) tryAll(i + 1, [...counts, ipos[i].options.length > 1 ? [r, s] : [r]]);
  })(0, []);
  const plan = planIpos(ipos, funds, accounts, "gain");
  const got = plan.applications.reduce((sum, app) => sum + app.accounts.length * app.option.odds * app.option.gain, 0);
  assert.ok(Math.abs(got - best) < 1e-6, `run ${run}: planner ${got} vs brute force ${best}`);
}

// A busy fortnight with the most accounts stays fast enough to plan on every keystroke.
{
  const ipos = Array.from({ length: 14 }, (_, i) => randomIpo(`B${i}`, THU + [0, 1, 4, 5, 6, 7][i % 6]));
  const started = performance.now();
  for (const funds of [100000, 500000, 2000000, 10000000]) planIpos(ipos, funds, 10, "gain");
  assert.ok(performance.now() - started < 1500, `worst case took ${Math.round(performance.now() - started)} ms`);
}

// A scraped IPO: lot table, GMP, odds and the T+3 dates.
{
  const doc = {
    upcoming_ipo_2025: "HD Fire Protect", ipo_type: "Mainboard", gmp_price_gain: "357 (31.73%)", rii_sr: "3.78", nii_sr: "11.38",
    ipo_dates: { ipo_close_date: "October 15, 2026", refunds: "October 19, 2026", ipo_listing_date: "October 21, 2026" },
    ipo_market_lot: [
      { application: "Retail Minimum", shares: "55", amount: "14,905" },
      { application: "S-HNI Minimum", shares: "770", amount: "2,08,670" },
    ],
  };
  const p = toPlannerIpo("x", doc, null);
  assert.equal(isSkipped(p), false);
  assert.deepEqual([p.closeDay, p.freeDay, p.cashDay], [THU, THU + 5, THU + 7], "free the day after the refund, cash the day after listing");
  assert.deepEqual(p.options.map((o) => [o.category, o.cost, Math.round(1 / o.odds), o.gain, o.estimated]), [["retail", 14905, 38, 4729, true], ["shni", 208670, 127, 66211, true]]);
  assert.equal(toPlannerIpo("y", { ...doc, ipo_dates: { ipo_close_date: "October 15, 2026", refunds: "2026" } }, null).freeDay, addWorkingDays(THU, 3), "a garbled refund date falls back to T+2");
  assert.equal(toPlannerIpo("z", { ...doc, gmp_price_gain: "52 (0.00%)" }, null).reason, "GMP is 0%, no listing gain expected");
}

console.log("ipo-planner: all checks passed");
