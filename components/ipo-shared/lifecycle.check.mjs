// Self-check: the timeline caption picked from lifecycle steps. Run with: node components/ipo-shared/lifecycle.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { lifecycleCaption } = await import("./lifecycle.ts");

const step = (name, days, state, date = "12 Oct") => ({ name, date, days, state });

assert.deepEqual(lifecycleCaption([step("Open", -2, "done"), step("Close", 0, "today")]), { tense: "today", name: "Close" }, "a step due today wins");
assert.equal(lifecycleCaption([step("Open", -1, "done"), step("Close", 3, "future")]).when.kind, "inDays", "3 days out reads in days");
assert.equal(lifecycleCaption([step("Open", 9, "future")]).when.kind, "onDate", "9 days out reads on the date");
assert.deepEqual(lifecycleCaption([step("Allot", -3, "done", "1 Oct"), step("List", -1, "done", "3 Oct")]), { tense: "past", name: "List", date: "3 Oct" }, "all done gives the last one");
assert.equal(lifecycleCaption([step("Open", null, "future", "TBA"), step("Close", null, "future", "TBA")]), null, "no dates gives null");
console.log("lifecycle.check ok");
