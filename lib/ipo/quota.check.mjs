// Self-check: the shareholder quota lists the page and its teasers read. Run with: node lib/ipo/quota.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { quotaRows, splitQuota } = await import("./quota.ts");

const day = (iso) => new Date(`${iso}T00:00:00Z`);
const doc = (id, fields) => ({
  _id: id, name: `${id} Ltd`, stage: "filed", parents: [`${id} Parent Ltd`], drhp_date: day("2026-09-01"),
  open_date: null, close_date: null, last_buy_date: null, listing_date: null, price_band: "", drhp_url: "", ipo_slug: "",
  checked_at: day("2026-11-01"), ...fields,
});
// The cache hands rows back as JSON, so the checks read them the same way.
const rows = (docs, listed = []) => JSON.parse(JSON.stringify(quotaRows(docs, listed)));
const ids = (list) => list.map((ipo) => ipo.id);
const at = (iso) => new Date(iso);

// A hidden doc appears in no list, including Recently listed.
{
  const hidden = { hidden: true };
  const split = splitQuota(rows(
    [doc("A", { admin: hidden }), doc("B", { stage: "announced", source: "admin", admin: hidden }), doc("C", {})],
    [doc("L", { listing_date: day("2026-10-01"), admin: hidden })],
  ), at("2026-11-09T06:00:00Z"));
  for (const list of ["ipos", "buyBefore", "approved", "filed", "rumoured", "closed", "listed"]) {
    assert.ok(!ids(split[list]).some((id) => ["A", "B", "L"].includes(id)), `no hidden doc in ${list}`);
  }
  assert.deepEqual(ids(split.filed), ["C"]);
}

// Overrides replace parents and name; clearing them restores the scraped values.
{
  const scraped = doc(77, { name: "Jsw One Ltd", parents: ["Jsw Steel Ltd."] });
  const [edited] = rows([{ ...scraped, admin: { hidden: false, overrides: { name: "JSW One Platforms Ltd", parents: ["JSW Steel Ltd."] } } }]).ipos;
  assert.equal(edited.name, "JSW One Platforms Ltd");
  assert.deepEqual(edited.parents, ["JSW Steel Ltd."]);
  assert.equal(edited.id, "77");
  const [cleared] = rows([{ ...scraped, admin: { hidden: false, overrides: {} } }]).ipos;
  assert.equal(cleared.name, "Jsw One Ltd");
  assert.deepEqual(cleared.parents, ["Jsw Steel Ltd."]);
}

// A rumour (BSE, admin or chittorgarh "announced") is in rumoured and not in ipos.
{
  const split = splitQuota(rows([
    doc("rumour:bse:123", { name: "GAIL Gas Ltd", stage: "announced", source: "bse", announced_on: day("2026-10-30"), announcement_url: "https://bse/x.pdf" }),
    doc("admin:foo", { stage: "announced", source: "admin", created_at: day("2026-11-02") }),
    doc(5, { stage: "announced" }),
    doc(6, {}),
  ]), at("2026-11-09T06:00:00Z"));
  assert.deepEqual(ids(split.rumoured), ["admin:foo", "rumour:bse:123", "5"]); // newest first; no date last
  assert.deepEqual(ids(split.ipos), ["6"]);
  const gail = split.rumoured.find((ipo) => ipo.id === "rumour:bse:123");
  assert.equal(gail.announcedOn, "2026-10-30");
  assert.equal(gail.announcementUrl, "https://bse/x.pdf");
  assert.equal(split.rumoured.find((ipo) => ipo.id === "admin:foo").announcedOn, "2026-11-02");
  assert.equal(gail.lapsed, null);
}

// An admin marks a rumour's SEBI approval lapsed; it stays a rumour and the tile carries the lapsed step.
{
  const split = splitQuota(rows([doc("admin:hero", { stage: "announced", source: "admin", admin: { overrides: { lapsed: "approved" } } })]), at("2026-11-12T06:00:00Z"));
  assert.equal(split.rumoured[0].lapsed, "approved");
}

// AE6: SEBI approved with a last day to buy but no bidding dates sits in Buy before, not under SEBI approved.
{
  const split = splitQuota(rows([doc(1, { stage: "approved", last_buy_date: day("2026-12-12") }), doc(2, { stage: "approved" })]), at("2026-12-10T06:00:00Z"));
  assert.deepEqual(ids(split.buyBefore), ["1"]);
  assert.deepEqual(ids(split.approved), ["2"]);
  assert.deepEqual(ids(split.ipos), ["1", "2"]);
}

// AE5: last day 12 Dec, bidding 14-16 Dec. Two days left on 10 Dec; past 3:30 PM IST on 12 Dec it stays with the
// deadline passed; after 5 PM IST on 16 Dec it moves to closed and out of ipos.
{
  const ipo = doc(9, { stage: "dates", open_date: day("2026-12-14"), close_date: day("2026-12-16"), last_buy_date: day("2026-12-12") });
  const cached = rows([ipo]);
  const on10th = splitQuota(cached, at("2026-12-10T06:00:00Z")).buyBefore[0];
  assert.equal(on10th.daysToLastBuy, 2);
  assert.equal(on10th.lastBuyClosed, false);
  assert.equal(splitQuota(cached, at("2026-12-12T09:59:00Z")).buyBefore[0].lastBuyClosed, false);
  const after = splitQuota(cached, at("2026-12-12T10:01:00Z"));
  assert.deepEqual([ids(after.buyBefore), after.buyBefore[0].lastBuyClosed], [["9"], true]);
  const shut = splitQuota(cached, at("2026-12-16T11:31:00Z"));
  assert.deepEqual([ids(shut.closed), shut.buyBefore, shut.ipos], [["9"], [], []]);
}

// A stage override moves the card; a date override sets the deadline.
{
  const split = splitQuota(rows([doc(3, { admin: { overrides: { stage: "approved", last_buy_date: day("2026-12-12") } } })]), at("2026-12-10T06:00:00Z"));
  assert.deepEqual([ids(split.buyBefore), split.buyBefore[0].stage, split.buyBefore[0].lastBuyDate], [["3"], "approved", "2026-12-12"]);
}

// Parent quotes older than 5 trading days are dropped: Friday 30 Oct is fresh through Friday 6 Nov.
{
  const cached = rows([doc(4, { parent_quotes: [{ name: "4 Parent Ltd", price: 182.5, as_of: day("2026-10-30") }] })]);
  assert.deepEqual(splitQuota(cached, at("2026-11-06T06:00:00Z")).filed[0].parentQuotes, [{ name: "4 Parent Ltd", price: 182.5, asOf: "2026-10-30" }]);
  assert.deepEqual(splitQuota(cached, at("2026-11-09T06:00:00Z")).filed[0].parentQuotes, []);
}

// Issue and quota size pass through; a missing checked_at does not crash and yields the latest one present.
{
  const cached = rows([doc(8, { checked_at: undefined, issue_size_cr: 1200, quota_size_cr: 120, quota_percent: 10 }), doc(10, {})]);
  assert.equal(cached.checkedAt, "2026-11-01T00:00:00.000Z");
  assert.deepEqual([cached.ipos[0].issueSizeCr, cached.ipos[0].quotaSizeCr, cached.ipos[0].quotaPercent], [1200, 120, 10]);
  assert.equal(rows([doc(8, { checked_at: undefined })]).checkedAt, null);
}

console.log("quota checks passed");

// Within ipos: strongest stage first, then nearest open date, then the latest DRHP news.
{
  const split = splitQuota(rows([
    doc(1, { stage: "filed", drhp_date: day("2026-09-01") }),
    doc(2, { stage: "filed", drhp_date: day("2026-11-01") }),
    doc(3, { stage: "approved", drhp_date: day("2026-08-01") }),
  ]), at("2026-11-09T06:00:00Z"));
  assert.deepEqual(ids(split.ipos), ["3", "2", "1"]);
}

// A BSE announcement stamped 01:15 IST shows that IST day, not the UTC day before.
{
  const split = splitQuota(rows([doc("rumour:bse:9", { stage: "announced", source: "bse", announced_on: new Date("2026-11-09T01:15:00+05:30") })]), at("2026-11-09T06:00:00Z"));
  assert.equal(split.rumoured[0].announcedOn, "2026-11-09");
}

// An admin's parent override drops the old parent's price at once.
{
  const quote = (name) => ({ name, price: 100, as_of: day("2026-11-06") });
  const split = splitQuota(rows([doc(7, { stage: "filed", parents: ["Old Parent Ltd."], parent_quotes: [quote("Old Parent Ltd.")], admin: { overrides: { parents: ["New Parent Ltd."] } } })]), at("2026-11-09T06:00:00Z"));
  assert.deepEqual(split.filed[0].parentQuotes, []);
}

// Dates set: nearest bidding first, an IPO without an open date after those with one.
{
  const { ipos } = rows([
    doc(11, { stage: "dates", open_date: null }),
    doc(12, { stage: "dates", open_date: day("2026-12-20") }),
    doc(13, { stage: "dates", open_date: day("2026-12-14") }),
    doc(14, { stage: "filed", drhp_date: day("2026-11-01") }),
  ]);
  assert.deepEqual(ids(ipos), ["13", "12", "11", "14"]);
}
