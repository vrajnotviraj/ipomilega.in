// Self-check for the Google News sitemap filter and entry. Run with: node lib/seo/news-sitemap.check.mjs
import assert from "node:assert/strict";
import { isFreshNews, modifiedAtOf, newsEntry } from "./news-sitemap.ts";

const now = Date.parse("2026-09-30T12:00:00Z");
const hoursAgo = (hours) => new Date(now - hours * 60 * 60 * 1000).toISOString();
const blog = (fields) => ({ slug: "acme-ipo", title: "Acme IPO", article_type: "subscription", created_at: hoursAgo(1), ...fields });

assert.equal(isFreshNews(blog({ article_type: "analysis" }), now), false);
assert.equal(isFreshNews(blog({ article_type: undefined }), now), false);
assert.equal(isFreshNews(blog({ created_at: hoursAgo(47) }), now), true);
assert.equal(isFreshNews(blog({ created_at: hoursAgo(49) }), now), false);
assert.equal(isFreshNews(blog({ created_at: hoursAgo(100), published_at: hoursAgo(2) }), now), true);

const entry = newsEntry(blog({ slug: "a&b", title: "Q&A <live>", created_at: hoursAgo(100), published_at: hoursAgo(2) }), "https://x.in", "X");
assert.match(entry, /<loc>https:\/\/x\.in\/blogs\/a&amp;b<\/loc>/);
assert.match(entry, /<news:title>Q&amp;A &lt;live><\/news:title>/);
assert.match(entry, new RegExp(`<news:publication_date>${hoursAgo(2)}</news:publication_date>`));

// A post saved the night before it publishes reports its publish time as last modified.
assert.equal(modifiedAtOf(blog({ updated_at: "2026-09-28T14:30:00Z", published_at: "2026-09-29T03:00:00Z" })), "2026-09-29T03:00:00Z");
assert.equal(modifiedAtOf(blog({ updated_at: "2026-09-30T05:00:00Z", published_at: "2026-09-29T03:00:00Z" })), "2026-09-30T05:00:00Z");

console.log("news-sitemap checks passed");
