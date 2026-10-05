// Self-check: cards and the analysis page show the same score. Run with: node lib/ipo-score.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." and extensionless relative imports to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { adjustedScoreOf, scoreOf } = await import("./ipo-score.ts");

const dateInDays = (days) => new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const analysis = { fundamentals: { score: 7 }, risk_meter: { score: 4 }, performance: { score: 6 }, flexibility: { score: 7 }, time: { score: 6 } };
const ipoClosing = (days, qib) => ({ qib_sr: qib, ipo_type: "Mainboard", ipo_dates: { ipo_close_date: dateInDays(days) } });

assert.equal(scoreOf({ analysis }), 6, "overall score is the mean of the five sections");
assert.equal(scoreOf({ analysis: null }), 0, "no analysis scores 0");
assert.equal(adjustedScoreOf({ analysis, ipo: ipoClosing(2, "0.38") }), 6, "QIB is ignored before the closing day");
assert.equal(adjustedScoreOf({ analysis, ipo: ipoClosing(0, "0.38") }), 6, "a low QIB on the closing day is not penalised");
assert.equal(adjustedScoreOf({ analysis, ipo: ipoClosing(0, "24") }), 7, "a strong QIB on the closing day adds a point");
assert.equal(adjustedScoreOf({ analysis, ipo: ipoClosing(-1, "0.38") }), 4.5, "a low QIB after close takes 1.5 off");

console.log("ipo-score: all checks passed");
