// Self-check for the IPO planner. Run with: node lib/ipo/planner/plan.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." imports to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { addWorkingDays, dateOf } = await import("./days.ts");
const { toPlannerIpo, isSkipped } = await import("./ipo.ts");
const { planIpos } = await import("./plan.ts");
const { parsePlanInputs } = await import("./inputs.ts");

const THU = 20741; // Thu 15 Oct 2026
assert.equal(dateOf(THU).toISOString().slice(0, 10), "2026-10-15");
assert.equal(addWorkingDays(THU, 2), THU + 4, "T+2 from a Thursday skips the weekend");

const ipo = (id, close, { cost = 15000, odds = 0.1, gain = 6000, shni, quota, free = addWorkingDays(close, 3) } = {}) => ({
  id, name: id, slug: null, logo: null, board: "Mainboard", gmpPercent: 40, closeDay: close, freeDay: free, cashDay: addWorkingDays(free, 1),
  quotaParents: quota ? ["Parent"] : null,
  options: [{ category: "retail", cost, odds, allotted: cost, gain, estimated: false }, ...(shni ? [shni] : []), ...(quota ? [quota] : [])],
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
  const shni = { category: "shni", cost: 210000, odds: 0.02, allotted: 210000, gain: 84000, estimated: false };
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
  const shni = rand() < 0.6 ? { category: "shni", cost: 205000 + rand() * 9000, odds: 1 / (sub * 3), allotted: 205000, gain: 60000 * rand(), estimated: false } : undefined;
  const cost = 14000 + rand() * 1000;
  const quota = rand() < 0.4 ? { category: "shareholder", cost, odds: 1 / (sub * 2), allotted: cost, gain: 5000 * rand(), estimated: false } : undefined;
  return ipo(id, close, { cost, odds: 1 / sub, gain: 8000 * rand(), shni, quota });
};
/** Every count of bids per option for one IPO: main categories share the accounts, the quota has its own count up to `holders`. */
const waysFor = (at, accounts, holders) => {
  const ways = [];
  (function give(k, left, counts) {
    if (k === at.options.length) return void ways.push(counts);
    if (at.options[k].category === "shareholder") for (let n = 0; n <= holders; n++) give(k + 1, left, [...counts, n]);
    else for (let n = 0; n <= left; n++) give(k + 1, left - n, [...counts, n]);
  })(0, accounts, []);
  return ways;
};
for (let run = 0; run < 300; run++) {
  const ipos = Array.from({ length: 2 + (run % 3) }, (_, i) => randomIpo(`I${i}`, THU + Math.floor(rand() * 8)));
  const funds = [30000, 60000, 250000, 450000][run % 4], accounts = 1 + (run % 3);
  const holders = Object.fromEntries(ipos.map((at) => [at.id, Math.floor(rand() * (accounts + 1))]));
  const worth = (counts) => counts.reduce((sum, c, i) => sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].odds * ipos[i].options[k].gain, 0), 0);
  const blockedOn = (counts, day) => counts.reduce((sum, c, i) => (ipos[i].closeDay <= day && day < ipos[i].freeDay ? sum + c.reduce((t, n, k) => t + n * ipos[i].options[k].cost, 0) : sum), 0);
  let best = 0;
  (function tryAll(i, counts) {
    if (i === ipos.length) {
      if (ipos.every((at) => blockedOn(counts, at.closeDay) <= funds)) best = Math.max(best, worth(counts));
      return;
    }
    for (const ways of waysFor(ipos[i], accounts, holders[ipos[i].id])) tryAll(i + 1, [...counts, ways]);
  })(0, []);
  const plan = planIpos(ipos, funds, accounts, "gain", holders);
  const got = plan.applications.reduce((sum, app) => sum + app.accounts.length * app.option.odds * app.option.gain, 0);
  assert.ok(Math.abs(got - best) < 1e-6, `run ${run}: planner ${got} vs brute force ${best}`);
}

// A shareholder bid rides on top of the account's retail bid, and only from accounts that hold the parent's shares.
{
  const quota = { category: "shareholder", cost: 15000, odds: 0.2, allotted: 15000, gain: 6000, estimated: false };
  const withQuota = ipo("A", THU, { quota });
  const bids = (holders) => planIpos([withQuota], 100000, 1, "gain", holders).applications.map((app) => [app.option.category, app.accounts]);
  assert.deepEqual(bids({ A: 1 }), [["retail", [1]], ["shareholder", [1]]], "one account bids in both");
  assert.deepEqual(bids({}), [["retail", [1]]], "no holders, no quota bid");
  assert.deepEqual(bids({ A: 5 }).find(([category]) => category === "shareholder"), ["shareholder", [1]], "holders are capped at the accounts");
}

// A busy fortnight with the most accounts stays fast enough to plan on every keystroke.
{
  const ipos = Array.from({ length: 14 }, (_, i) => randomIpo(`B${i}`, THU + [0, 1, 4, 5, 6, 7][i % 6]));
  const started = performance.now();
  for (const funds of [100000, 500000, 2000000, 10000000]) planIpos(ipos, funds, 10, "gain");
  assert.ok(performance.now() - started < 1500, `worst case took ${Math.round(performance.now() - started)} ms`);
}

// Six IPOs offering every category, ten accounts and ₹1 crore: the search is capped, not left to run for minutes.
{
  const option = (category, cost, odds) => ({ category, cost, odds, allotted: cost, gain: cost * 0.3, estimated: false });
  const ipos = Array.from({ length: 6 }, (_, i) => ({
    ...ipo(`Q${i}`, THU + i), quotaParents: ["Parent"],
    options: [option("retail", 15000, 0.1), option("shni", 205000, 0.03), option("bhni", 1000000, 0.02), option("shareholder", 15000, 0.15)],
  }));
  const started = performance.now();
  planIpos(ipos, 10000000, 10, "gain", Object.fromEntries(ipos.map((at) => [at.id, 5])));
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
  assert.deepEqual([p.closeDay, p.freeDay, p.cashDay], [THU, THU + 4, THU + 7], "free on the refund date, cash the day after listing");
  assert.deepEqual(p.options.map((o) => [o.category, o.cost, Math.round(1 / o.odds), o.gain, o.estimated]), [["retail", 14905, 38, 4729, true], ["shni", 208670, 127, 66211, true]]);
  assert.equal(toPlannerIpo("y", { ...doc, ipo_dates: { ipo_close_date: "October 15, 2026", refunds: "2026" } }, null).freeDay, addWorkingDays(THU, 2), "a garbled refund date falls back to T+2");
  assert.equal(toPlannerIpo("w", { ...doc, ipo_dates: { ipo_close_date: "October 15, 2026", refunds: "October 15, 2026" } }, null).freeDay, addWorkingDays(THU, 2), "a refund on the close date falls back to T+2");
  assert.equal(toPlannerIpo("z", { ...doc, gmp_price_gain: "52 (0.00%)" }, null).reason, "GMP is 0%, no listing gain expected");
}

// B-HNI: the bid blocks ~10 lakh but a lottery winner gets the S-HNI minimum, and under about 5x everyone is allotted pro rata.
{
  const lots = [
    { application: "Retail Minimum", amount: "15,000" },
    { application: "S-HNI Minimum", amount: "2,00,000" },
    { application: "B-HNI Minimum", amount: "10,00,000" },
  ];
  const doc = (gmp, bnii) => ({
    upcoming_ipo_2025: "X", ipo_type: "Mainboard", gmp_price_gain: `10 (${gmp}%)`, bnii_sr: bnii, snii_sr: "1", rii_sr: "1",
    ipo_dates: { ipo_close_date: "October 15, 2026" }, ipo_market_lot: lots,
  });
  const bhni = (gmp, bnii) => toPlannerIpo("x", doc(gmp, bnii), null).options.find((o) => o.category === "bhni");

  const drawn = bhni(5, "40");
  assert.equal(Math.round(1 / drawn.odds), 8, "40x subscribed: 1 in 40 x 0.2");
  assert.deepEqual([drawn.cost, drawn.allotted, drawn.gain, drawn.estimated], [1000000, 200000, 10000, false]);

  const prorata = bhni(0.5, "3");
  assert.equal(prorata.odds, 1, "3x subscribed: everyone is allotted");
  assert.equal(prorata.allotted, Math.round(1000000 / 3), "a third of the application, more than the S-HNI minimum");

  const estimate = bhni(10, "1");
  assert.equal(estimate.estimated, true, "no live figure yet: estimated from the GMP");
  assert.equal(Math.round(1 / estimate.odds), 12, "GMP 10% x 6 = 60x, times 0.2");
}

// On the last day the live subscription wins even when the GMP estimate is higher; before then the higher of the two does.
{
  const doc = {
    upcoming_ipo_2025: "Big", ipo_type: "Mainboard", gmp_price_gain: "250 (22.3%)", rii_sr: "2.72",
    ipo_dates: { ipo_close_date: "October 15, 2026" }, ipo_market_lot: [{ application: "Retail Minimum", amount: "13,428" }],
  };
  const retail = (today) => toPlannerIpo("big", doc, null, null, today).options[0];
  assert.deepEqual([Math.round(10 / retail(THU).odds) / 10, retail(THU).estimated], [2.7, false], "last day: live 2.72x");
  assert.deepEqual([Math.round(10 / retail(THU - 1).odds) / 10, retail(THU - 1).estimated], [26.8, true], "earlier: the 26.8x estimate is higher");
  assert.equal(retail(THU).gain, Math.round((13428 * 22.3) / 100));
}

// The shareholder quota: only when the IPO has one, at retail's cost and odds.
{
  const doc = {
    upcoming_ipo_2025: "Jio", ipo_type: "Mainboard", gmp_price_gain: "250 (22.3%)", rii_sr: "2.72", shareholder_sr: "7.6",
    ipo_dates: { ipo_close_date: "October 15, 2026" }, ipo_market_lot: [{ application: "Retail Minimum", amount: "13,428" }],
  };
  const categories = (parents, extra = {}) => toPlannerIpo("j", { ...doc, ...extra }, null, parents).options.map((o) => o.category);
  assert.deepEqual(categories(["Reliance Industries"]), ["retail", "shareholder"]);
  assert.deepEqual(categories(null), ["retail", "shareholder"], "a live shareholder figure alone is enough");
  assert.deepEqual(categories(null, { shareholder_sr: undefined }), ["retail"], "no quota, no quota bid");
  const quota = toPlannerIpo("j", doc, null, ["Reliance Industries"]).options[1];
  assert.deepEqual([quota.cost, Math.round(1 / quota.odds * 10) / 10, quota.estimated], [13428, 26.8, true], "GMP 22.3% x 1.2 beats the live 7.6x");
}

// The server only plans inputs in range.
{
  const ok = { ids: ["a"], funds: 100000, accounts: 2, goal: "gain", holders: { a: 1 } };
  assert.deepEqual(parsePlanInputs(ok), ok);
  for (const bad of [null, { ...ok, funds: -1 }, { ...ok, funds: 1e12 }, { ...ok, accounts: 0 }, { ...ok, accounts: 11 }, { ...ok, goal: "x" }, { ...ok, ids: [1] }, { ...ok, holders: { a: 1.5 } }, { ...ok, holders: null }]) {
    assert.equal(parsePlanInputs(bad), null);
  }
}

console.log("ipo-planner: all checks passed");
