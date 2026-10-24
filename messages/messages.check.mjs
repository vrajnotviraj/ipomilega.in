// Checks every hi and gu message exists in English and keeps its {placeholders}. Run with: node messages/messages.check.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL(".", import.meta.url);
const read = (lang, file) => JSON.parse(readFileSync(new URL(`${lang}/${file}`, dir), "utf8"));
const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

for (const file of readdirSync(new URL("en", dir)).filter((f) => f.endsWith(".json"))) {
  const en = new Map(flatten(read("en", file)));
  for (const lang of ["hi", "gu"]) {
    for (const [key, value] of flatten(read(lang, file))) {
      assert.ok(en.has(key), `${lang}/${file} ${key} is not in en`);
      assert.equal(placeholders(value), placeholders(en.get(key)), `${lang}/${file} ${key}`);
    }
  }
}
