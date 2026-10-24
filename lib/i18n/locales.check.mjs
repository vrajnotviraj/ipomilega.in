// Self-check for the language paths and templates. Run with: node lib/i18n/locales.check.mjs
import assert from "node:assert/strict";
import { bareSitePath, fill, languageAlternates, localePath, localize, plural } from "./locales.ts";

assert.equal(localePath("en", "/ipos"), "/ipos");
assert.equal(localePath("hi", "/"), "/hi");
assert.equal(localePath("gu", "/ipos?filter=live"), "/gu/ipos?filter=live");
assert.equal(localePath("hi", "#main"), "#main");
assert.equal(localePath("hi", "https://x.com/ipomilega"), "https://x.com/ipomilega");

assert.equal(bareSitePath("/hi/ipos"), "/ipos");
assert.equal(bareSitePath("/gu"), "/");
assert.equal(bareSitePath("/ipos"), "/ipos");
assert.equal(bareSitePath("/history"), "/history");

assert.deepEqual(languageAlternates("/about", "https://s"), {
  "en-IN": "https://s/about",
  "hi-IN": "https://s/hi/about",
  "gu-IN": "https://s/gu/about",
  "x-default": "https://s/about",
});
assert.deepEqual(languageAlternates("/blogs/x", "https://s", ["en", "hi"]), { "en-IN": "https://s/blogs/x", "hi-IN": "https://s/hi/blogs/x", "x-default": "https://s/blogs/x" });

assert.equal(fill("Next opens {date}", { date: "12 Jun" }), "Next opens 12 Jun");
assert.equal(fill("{a} and {missing}", { a: 1 }), "1 and {missing}");
assert.equal(plural({ one: "{count} IPO", other: "{count} IPOs" }, 1), "1 IPO");
assert.equal(plural({ one: "{count} IPO", other: "{count} IPOs" }, 0), "0 IPOs");

const doc = { a: { b: ["x", "y"] } };
assert.deepEqual(localize(doc, { "a.b.1": "Y", "a.c.d": "skipped" }), { a: { b: ["x", "Y"] } });
assert.deepEqual(doc, { a: { b: ["x", "y"] } });
assert.deepEqual(localize(doc, null), doc);

console.log("locales ok");
