// Self-check for the IPO date parser. Run with: node lib/ipo-format.check.mjs
import assert from "node:assert/strict";
import { daysFromToday, formatIstTimestamp, getUseOfProceeds, parseIpoDate } from "./ipo-format.ts";

const ymd = (date) => date && [date.getFullYear(), date.getMonth() + 1, date.getDate()];
const thisYear = new Date().getFullYear();

assert.equal(parseIpoDate("TBA"), null);
assert.equal(parseIpoDate("-"), null);
assert.equal(parseIpoDate(""), null);
assert.equal(parseIpoDate("2026"), null);
assert.equal(parseIpoDate("January 2026"), null);
assert.equal(parseIpoDate("June"), null);
assert.deepEqual(ymd(parseIpoDate("12 June")), [thisYear, 6, 12]);
assert.deepEqual(ymd(parseIpoDate("June 12, 2026")), [2026, 6, 12]);
assert.deepEqual(ymd(parseIpoDate("12/06/2026")), [2026, 6, 12]);
assert.deepEqual(ymd(parseIpoDate("2026-06-12")), [2026, 6, 12]);

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
assert.equal(daysFromToday(today), 0);
assert.equal(daysFromToday("TBA"), null);

assert.match(formatIstTimestamp("2026-09-30T10:05:29.019Z"), /^30 Sept?, 15:35 IST$/);
assert.match(formatIstTimestamp("2026-09-26T09:17:28.747836"), /^26 Sept?, 14:47 IST$/);
assert.equal(formatIstTimestamp("not a date"), null);

const aOne = getUseOfProceeds({ issue: {
  objects: [{ purpose: "Repay borrowings", amount_cr: 250, percent: 70.42 }, { purpose: "General Corporate Purposes", amount_cr: 75.86, percent: 21.37 }],
  fresh_issue_cr: 355, offer_for_sale_cr: 50 } });
assert.equal(aOne.items.length, 2);
assert.deepEqual(Object.keys(aOne), ["items", "freshCr", "ofsCr"], "no source or capture time reaches the card");
assert.deepEqual([aOne.freshCr, aOne.ofsCr], [355, 50]);
// A blank GCP amount stays null, so the card reads "Not stated".
const nullGcp = getUseOfProceeds({ issue: { objects: [{ purpose: "Capex", amount_cr: 40.03, percent: null }, { purpose: "GCP", amount_cr: null, percent: null }] } });
assert.equal(nullGcp.items[1].amount_cr, null);
assert.equal(nullGcp.freshCr, null);
// OFS-only: no items, fresh 0, still shown.
assert.deepEqual(getUseOfProceeds({ issue: { fresh_issue_cr: 0, offer_for_sale_cr: 120 } }).items, []);
// A fresh issue with an OFS but no objects list is not OFS-only, and there is nothing to list.
assert.equal(getUseOfProceeds({ issue: { fresh_issue_cr: 145, offer_for_sale_cr: 33 } }), null);
assert.equal(getUseOfProceeds({ issue: {} }), null);
assert.equal(getUseOfProceeds({}), null);

console.log("ipo-format checks passed");
