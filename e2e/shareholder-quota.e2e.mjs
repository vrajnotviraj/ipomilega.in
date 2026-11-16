// End-to-end tests for /ipos/shareholder-quota against a running site.
// Run: npm run test:e2e (E2E_URL=http://localhost:3000 by default)
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { launch } from "./browser.mjs";

const SITE = process.env.E2E_URL ?? "http://localhost:3000";
const LANGS = { en: "", hi: "/hi", gu: "/gu" };
const words = (lang) => JSON.parse(readFileSync(new URL(`../messages/${lang}/quota.json`, import.meta.url)));

let browser;
before(async () => (browser = await launch()));
after(() => browser.close());

/** Everything the tests read from a rendered page, collected in one pass. */
function readPage() {
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent));
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? "",
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
    h1s: [...document.querySelectorAll("h1")].map((h1) => h1.textContent.trim()),
    schemaTypes: jsonLd.map((data) => data["@type"]),
    faqSchemaCount: jsonLd.find((data) => data["@type"] === "FAQPage")?.mainEntity.length ?? 0,
    listModified: jsonLd.find((data) => data["@type"] === "CollectionPage")?.dateModified ?? null,
    faqShown: document.querySelectorAll("#faq-title ~ dl dt").length,
    poolsTitle: document.querySelector("#pools-title")?.textContent ?? "",
    rules: document.querySelectorAll('[aria-labelledby="pools-title"] dl > div').length,
    steps: [...document.querySelectorAll('[aria-labelledby="how-title"] li h3')].map((h3) => h3.textContent),
    chipTargets: [...document.querySelectorAll('nav a[href^="#"]')].map((a) => Boolean(document.getElementById(a.hash.slice(1)))),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    rails: [...document.querySelectorAll('[aria-labelledby="how-title"] .grow-in')].map((rail) => getComputedStyle(rail).animationName),
  };
}

for (const [lang, prefix] of Object.entries(LANGS)) {
  describe(`shareholder quota page (${lang})`, () => {
    const d = words(lang);
    const url = `${SITE}${prefix}/ipos/shareholder-quota`;
    let phone;
    let desktop;

    before(async () => {
      const [onPhone, onDesktop] = await Promise.all([browser.open(url, { width: 360 }), browser.open(url, { width: 1280 })]);
      [phone, desktop] = await Promise.all([onPhone.run(readPage), onDesktop.run(readPage)]);
      onPhone.close();
      onDesktop.close();
    });

    test("has one heading and a title, description and canonical for search", () => {
      assert.equal(phone.h1s.length, 1);
      assert.ok(phone.h1s[0].includes(d.hero.highlight));
      assert.ok(phone.title.startsWith(d.meta.title.split("{year}")[0].trim()), phone.title);
      assert.ok(phone.description.endsWith(d.hero.lede), phone.description);
      assert.ok(phone.canonical.endsWith(`${prefix}/ipos/shareholder-quota`), phone.canonical);
    });

    test("carries the list, breadcrumb and question structured data", () => {
      for (const type of ["CollectionPage", "BreadcrumbList", "FAQPage"]) assert.ok(phone.schemaTypes.includes(type), type);
      assert.ok(phone.listModified, "CollectionPage has dateModified");
      assert.equal(phone.faqSchemaCount, d.faq.items.length);
      assert.equal(phone.faqShown, d.faq.items.length, "every question in the structured data is on the page");
    });

    test("explains the two pools and the three rules", () => {
      assert.equal(phone.poolsTitle, d.hero.split.title);
      assert.equal(phone.rules, d.hero.rules.length);
    });

    test("lists the five steps to apply in order", () => {
      assert.deepEqual(phone.steps, d.how.steps.map((step) => step.title));
    });

    test("every stage link goes to a stage on the page", () => {
      assert.ok(phone.chipTargets.every(Boolean), JSON.stringify(phone.chipTargets));
    });

    test("fits a 360px phone without scrolling sideways", () => {
      assert.ok(phone.overflow <= 0, `${phone.overflow}px too wide`);
    });

    test("fills the timeline rail on scroll from md", () => {
      assert.equal(desktop.rails.length, d.how.steps.length - 1);
      assert.ok(desktop.rails.every((name) => name === "grow-in"), desktop.rails.join());
    });
  });
}

test("the timeline stays still for reduced motion", async () => {
  const page = await browser.open(`${SITE}/ipos/shareholder-quota`, { width: 1280, reducedMotion: true });
  const { rails } = await page.run(readPage);
  page.close();
  assert.ok(rails.every((name) => name === "none"), rails.join());
});
