// Self-check: quick filters and sorting on /ipos. Run with: node components/ipos/model/views.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { compareBy, matchesQuick, clickSort } = await import("./views.ts");
const { issueSizeOf, sizeOf } = await import("./cells.ts");

const listed = (name, held) => ({ status: "Listed", steps: [], analysis: null, ipo: { upcoming_ipo_2025: name, ipo_price: "100", last_price: held === null ? "" : String(100 + held) } });
const rows = [listed("B", 10), listed("A", 60), listed("C", -5), listed("D", null)];

const order = (sort) => [...rows].sort(compareBy(sort)).map((row) => row.ipo.upcoming_ipo_2025).join("");
assert.equal(order({ by: "heldGain", dir: "desc" }), "ABCD", "highest held gain first, no data last");
assert.equal(order({ by: "heldGain", dir: "asc" }), "CBAD", "no data stays last when ascending");
assert.equal(order({ by: "name", dir: "desc" }), "DCBA", "names sort Z to A");

const names = (quick) => rows.filter((row) => matchesQuick(row, quick)).map((row) => row.ipo.upcoming_ipo_2025).join("");
assert.equal(names("held25"), "A", "25%+ held till today");
assert.equal(names("heldDown"), "C", "below issue price");
assert.equal(names(null), "BACD", "no quick filter keeps every row");

assert.deepEqual(clickSort({ by: "gmp", dir: "desc" }, "gmp"), { by: "gmp", dir: "asc" }, "second click flips");
assert.deepEqual(clickSort({ by: "gmp", dir: "desc" }, "name"), { by: "name", dir: "asc" }, "a new text column starts A to Z");
const sized = (ipo) => ({ status: "Open", steps: [], analysis: null, ipo });
assert.equal(issueSizeOf(sized({ ipo_size: "500 Cr." })), "₹500 Cr.", "the feed's amount");
const core4 = sized({ ipo_size: "", ipo_details: { issue_size: "58,94,400 shares (agg. up to 55 Cr)" } });
assert.equal(issueSizeOf(core4), "₹55 Cr.", "no feed size falls back to the detail page's");
assert.equal(sizeOf(core4), 55, "and sorts by it");
assert.equal(issueSizeOf(sized({ ipo_size: "Approx 108.42 Crores" })), "₹108.42 Cr.", "an Approx feed size reads as an amount");
console.log("views.check ok");
