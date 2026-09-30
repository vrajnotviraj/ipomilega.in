// Self-check for the IPO date parser. Run with: node lib/ipo-format.check.mjs
import assert from "node:assert/strict";
import { daysFromToday, parseIpoDate } from "./ipo-format.ts";

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

console.log("ipo-format date checks passed");
