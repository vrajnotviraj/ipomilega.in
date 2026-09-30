// Self-check: the "On this page" ids from headingsOf match the ids MarkdownRenderer gives the rendered headings.
// Runs the same unified pipeline react-markdown uses. Run with: node components/blog/headings.check.mjs
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { headingIds, headingsOf } from "./headings.ts";

const textOf = (node) => (node.type === "text" ? node.value : "children" in node ? node.children.map(textOf).join("") : "");

/** Section ids as MarkdownRenderer assigns them: one counter over h1-h3 in order, h1 and h2 listed. */
function renderedSectionIds(markdown) {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeSanitize).runSync(unified().use(remarkParse).parse(markdown));
  const idFor = headingIds();
  const ids = [];
  const walk = (node) => {
    if (node.type === "element" && /^h[1-3]$/.test(node.tagName)) {
      const id = idFor(textOf(node));
      if (node.tagName !== "h3") ids.push(id);
    }
    (node.children || []).forEach(walk);
  };
  walk(tree);
  return ids;
}

const post = `
# Moneyview IPO at a glance
Intro.

## Grey market premium (GMP)
## IPO Milega score: 7.4 / 10 (Strong)
## Why **this** _matters_ for ipo_listing
## See [the RHP](https://example.com/rhp) first
## Uses \`inline code\`
## Risks to watch ##
### Risks to watch
## Risks to watch

\`\`\`md
## Not a heading, inside a fence
\`\`\`

## Our take
`;

const listed = headingsOf(post);
assert.deepEqual(listed.map((h) => h.id), renderedSectionIds(post));
assert.deepEqual(listed.map((h) => h.id), [
  "moneyview-ipo-at-a-glance",
  "grey-market-premium-gmp",
  "ipo-milega-score-7-4-10-strong",
  "why-this-matters-for-ipo-listing",
  "see-the-rhp-first",
  "uses-inline-code",
  "risks-to-watch",
  "risks-to-watch-3",
  "our-take",
]);
assert.equal(listed[3].text, "Why this matters for ipo_listing");
assert.equal(listed[4].text, "See the RHP first");
assert.equal(headingsOf("No headings here.").length, 0);

console.log("headings checks passed");
