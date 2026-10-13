// Self-check for the IPO planner. Run with: node lib/ipo-planner.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." and extensionless relative imports to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { addWorkingDays, planIpos, toPlannerIpo, isSkipped } = await import("./ipo-planner.ts");

// Days are day numbers; 20741 is Thu 15 Oct 2026.
const THU = 20741;
assert.equal(new Date(THU * 86_400_000).toISOString().slice(0, 10), "2026-10-15");
assert.equal(addWorkingDays(THU, 2), THU + 4, "T+2 from a Thursday skips the weekend");

const ipo = (id, close, { cost = 15000, odds = 0.1, gain = 6000, shni, free = addWorkingDays(close, 3) } = {}) => ({
  id, name: id, slug: null, logo: null, board: "Mainboard", gmpPercent: 40, closeDay: close, freeDay: free,
  cashDay: addWorkingDays(free, 1), listingDay: free, datesEstimated: false,
  options: [{ category: "retail", cost, odds, gain, subscription: 1 / odds, estimated: false }, ...(shni ? [shni] : [])],
});
const accountsOn = (plan, id) => plan.applications.filter((app) => app.ipo.id === id).reduce((n, app) => n + app.accounts.length, 0);

// Money freed by A (back on its free day) pays for B when B closes that day or later.
{
  const a = ipo("A", THU), b = ipo("B", addWorkingDays(THU, 3));
  const plan = planIpos([a, b], 15000, 1, "gain");
  assert.deepEqual([accountsOn(plan, "A"), accountsOn(plan, "B")], [1, 1], "reuses unblocked money");
  assert.equal(plan.applications.find((app) => app.ipo.id === "B").atRisk, true, "B waits on A's money, so an allotment in A blocks it");
}
// B closes before A's money is free: one bid only, the better one.
{
  const a = ipo("A", THU), b = ipo("B", addWorkingDays(THU, 2), { gain: 9000 });
  const plan = planIpos([a, b], 15000, 1, "gain");
  assert.deepEqual([accountsOn(plan, "A"), accountsOn(plan, "B")], [0, 1], "picks the better of two overlapping IPOs");
}
// Accounts cap bids per IPO; spare money then goes to S-HNI.
{
  const shni = { category: "shni", cost: 210000, odds: 0.02, gain: 84000, subscription: 50, estimated: false };
  const plan = planIpos([ipo("A", THU, { shni })], 300000, 2, "gain");
  assert.equal(plan.applications.length, 2, "one retail and one S-HNI bid");
  assert.equal(plan.peakBlocked, 225000);
  assert.deepEqual(plan.applications.map((app) => app.accounts), [[2], [1]], "each account bids once per IPO");
}
// Goals: gain prefers the bigger GMP, allotments the better odds.
{
  const rich = ipo("rich", THU, { odds: 0.05, gain: 20000 }), easy = ipo("easy", THU, { odds: 0.5, gain: 500 });
  assert.equal(planIpos([rich, easy], 15000, 1, "gain").applications[0].ipo.id, "rich");
  assert.equal(planIpos([rich, easy], 15000, 1, "allotments").applications[0].ipo.id, "easy");
  const plan = planIpos([rich, easy], 30000, 1, "gain");
  assert.ok(Math.abs(plan.chanceOfAny - (1 - 0.95 * 0.5)) < 1e-9, "chance of any allotment multiplies the misses");
}
// Not enough for one lot: an empty plan, not a crash.
assert.equal(planIpos([ipo("A", THU)], 1000, 3, "gain").applications.length, 0);

// Exact: matches brute force on random calendars.
let seed = 11;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
for (let run = 0; run < 300; run++) {
  const ipos = Array.from({ length: 2 + (run % 3) }, (_, i) => {
    const sub = 1 + rand() * 80;
    const shni = rand() < 0.6 ? { category: "shni", cost: 205000 + rand() * 9000, odds: 1 / (sub * 3), gain: 60000 * rand(), subscription: sub * 3, estimated: false } : undefined;
    return ipo(`I${i}`, THU + Math.floor(rand() * 8), { cost: 14000 + rand() * 1000, odds: 1 / sub, gain: 8000 * rand(), shni });
  });
  const funds = [30000, 60000, 250000, 450000][run % 4], accounts = 1 + (run % 3);
  const worthOf = (counts) => counts.reduce((sum, c, i) => sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].odds * ipos[i].options[k].gain, 0), 0);
  const fits = (counts) => ipos.every((at) => counts.reduce((sum, c, i) => (ipos[i].closeDay <= at.closeDay && at.closeDay < ipos[i].freeDay ? sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].cost, 0) : sum), 0) <= funds);
  let best = 0;
  (function go(i, counts) {
    if (i === ipos.length) { if (fits(counts)) best = Math.max(best, worthOf(counts)); return; }
    for (let r = 0; r <= accounts; r++) for (let s = 0; s <= (ipos[i].options.length > 1 ? accounts - r : 0); s++) go(i + 1, [...counts, ipos[i].options.length > 1 ? [r, s] : [r]]);
  })(0, []);
  const plan = planIpos(ipos, funds, accounts, "gain");
  const got = plan.applications.reduce((sum, app) => sum + app.accounts.length * app.option.odds * app.option.gain, 0);
  assert.ok(Math.abs(got - best) < 1e-6, `run ${run}: planner ${got} vs brute force ${best}`);
}

// From a scraped IPO: lot table, GMP, odds and the T+3 schedule.
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
  assert.equal(p.closeDay, THU);
  assert.equal(p.freeDay, THU + 5, "free the working day after the Monday refund");
  assert.equal(p.cashDay, THU + 7, "allotted money is back the day after listing");
  assert.deepEqual(p.options.map((o) => [o.category, o.cost, Math.round(o.subscription), o.estimated]), [["retail", 14905, 38, true], ["shni", 208670, 127, true]]);
  assert.equal(p.options[0].gain, 4729);
  assert.equal(toPlannerIpo("y", { ...doc, ipo_dates: { ipo_close_date: "October 15, 2026", refunds: "2026" } }, null).freeDay, addWorkingDays(THU, 3), "a bad refund date falls back to T+2");
  assert.equal(toPlannerIpo("z", { ...doc, gmp_price_gain: "52 (0.00%)" }, null).reason, "GMP is 0%, no listing gain expected");
}

console.log("ipo-planner: all checks passed");
