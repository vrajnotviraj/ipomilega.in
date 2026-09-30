# SEO audit

State of ipomilega.in as of 30 Sep 2026, after the `feat/seo-blog-foundation` changes. Counts come from the production database on that date: 100 IPOs, 74 analysis documents, 4 published blog posts.

## Framework and rendering

Next.js 15 App Router with Tailwind v4, deployed as a Node app. Every public page is server rendered. Home, `/ipos` and `/analysis/[slug]` use ISR (60 s), `/blogs` 10 min, the sitemaps 5 to 10 min. Mongo reads go through `unstable_cache` with a `site-data` tag that the engine purges through `/api/revalidate` after each write. `/blogs/[slug]` renders on demand with the same cached reads.

Client-only pieces: the GMP trend chart (fetches `/api/ipo/[id]/gmp-history`), the related IPO card on blog posts, the `/ipos` filters and the blog search. None of them hold content that needs to rank; the crawlable links next to them are server rendered.

## Routes

| Route | Purpose | Indexed |
|---|---|---|
| `/` | Live, closed, upcoming and listed IPOs | yes |
| `/ipos` | Every IPO with status and board filters (`?filter=` is client state) | yes, canonical `/ipos` |
| `/analysis/[slug]` | IPO entity page | yes when an analysis exists, `noindex` otherwise |
| `/blogs` | Blog index with search | yes |
| `/blogs/[slug]` | One article | yes, published only; drafts 404 |
| `/about` | Data sources and scoring | yes |
| `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt`, `/llms.txt` | Discovery | n/a |
| `/api/*`, `/ingest/*` | Data API and PostHog proxy | `/api/revalidate`, `/api/subscription` and `/ingest/` disallowed; `/api/ipo/*` stays crawlable so rendered pages keep their GMP chart |

`/analysis` redirects permanently to `/ipos`.

## IPO pages

`/analysis/[slug]` is the entity page. Title now follows the spec: "<Company> IPO: GMP, Price, Dates, Lot Size & Allotment | IPO Milega". The description is built from GMP, the closing date, the business line and the score. The keyword list is gone. The page has a visible breadcrumb (Home / IPOs / <Company> IPO), Article, FAQPage and BreadcrumbList JSON-LD, and a "Latest on <Company> IPO" block that links every published article with the same `ipo_id`.

GMP is labelled "GMP (unofficial)" in the headline figures, with a note under them giving the last grey market read time in IST. The GMP trend card and the estimated listing strip say the quotes are unofficial.

**Biggest gap:** an IPO only gets an entity page once an analysis document exists. 26 of 100 IPOs have none, so they have no indexable URL at all, and blog posts about them can only link to `/ipos`. An unknown or not-yet-analysed slug returns 200 with an "Analysis in progress" message; it is now `noindex`, but a real 404 or a basic facts page would be cleaner.

## Blog pages

Articles live at `/blogs/<slug>`. Each now has a visible breadcrumb (Home / Blog / title), BreadcrumbList JSON-LD, and a BlogPosting JSON-LD node. The author is the Organization "IPO Milega Research" for engine articles and a Person for manual ones. The page shows an "Updated" date when `updated_at` differs from `created_at`, and ends with "More on <Company> IPO" linking the entity page and sibling articles. The keywords meta tag was dropped. The OG image now reads `image_url`, the field posts actually store.

The four existing posts are manual (`author: "Admin"`, category "IPO Analysis") with long keyword-style slugs. They keep their URLs.

## Metadata and canonicals

The root layout sets `metadataBase`, a title template, Open Graph and Twitter defaults and generous `max-snippet` / `max-image-preview`. Every indexable route sets a self canonical through `alternates.canonical`, including `/ipos` and `/blogs`, so filter and search URLs consolidate. The home page still carries a `keywords` array; it does no harm and no good.

## Robots and sitemaps

`robots.txt` allows everything except `/api/revalidate`, `/api/subscription` and `/ingest/`, and lists both sitemaps. `sitemap.xml` lists the four static pages, every analysis slug (lastModified from the analysis `updated_at`) and every published post (lastModified from `updated_at`). Analysis slugs and IPO slugs match for all 74 documents, so the sitemap has no soft-404 entries. `news-sitemap.xml` follows the Google News format and lists only engine news articles published in the last 48 hours; it is empty today.

## Structured data

- Root layout: Organization and WebSite, once per page.
- Entity page: Article about the Corporation, FAQPage from the verified facts, BreadcrumbList.
- Blog post: BlogPosting with the publisher referenced by `@id` and `mainEntityOfPage`, BreadcrumbList.

FAQPage no longer earns rich results for most sites, but the questions still help answer engines.

## Internal linking

Header and footer link Home, IPOs, Blog and About. IPO cards and table rows link entity pages. Entity pages now link their articles, and articles link back to the entity page and to each other. Markdown links inside posts always open in a new tab, internal ones included; a small fix in `MarkDown.tsx` would keep internal links in the same tab.

## Page speed, images and mobile

CSS ships inline (about 12 KB gzipped), only Figtree is preloaded, the home page renders without a Suspense spinner, and recharts loads on the client only where charts appear. Images go through `next/image` with a 30 day cache for S3 objects. OG and Twitter images are generated per IPO. The layout is phone first with a 16 px gutter. No field data (CrUX) was checked for this audit.

## Indexing, duplicate and cannibalization risks

- Legacy analysis posts compete with the entity page for "<Company> IPO". The engine treats a legacy post with the same `ipo_id` and category "IPO Analysis" as owning the analysis intent and skips a new one, which keeps it to two URLs per IPO.
- The entity page title and the analysis article title share "GMP" and "IPO". They split by intent: the entity page answers "<Company> IPO" and "GMP", the article answers "analysis" and "review".
- IPOs without an analysis document have no entity page (see above).
- The IPO name field is still `upcoming_ipo_2025`; unrelated to SEO but easy to misread.

## Orphan pages

None found among indexed URLs: every analysis is linked from `/ipos`, every post from `/blogs`. Entity pages for IPOs that have left the home page rely on `/ipos` and the sitemap.

## Content generation

The engine writes articles into the `blogs` collection with `article_type`, `ipo_id`, `primary_keyword`, `search_intent`, `source_references`, `facts_as_of` and the "IPO Milega Research" author. Posts that fail validation stay drafts and never render. The rules live in `CONTENT_RULES.md` in the engine repo.

## Strengths

- Server-rendered pages with ISR and tag-based purges, so fresh data without per-change URLs.
- One entity page per analysed IPO with real, structured facts.
- Honest GMP labelling and an AI disclaimer on analysis pages.
- Clean URL set: no per-day pages, no parameter URLs in the sitemap.

## Weaknesses

- 26 IPOs have no entity page.
- The "Analysis in progress" state answers 200 for any slug.
- Only four posts, all manual with keyword-style slugs.
- Internal links in markdown open in new tabs.
- No IPO history hub (by year or by month) for older listings.

## Prioritised fixes

1. Give every IPO an entity page, built from the `ipos` document alone when there is no analysis yet, and return 404 for unknown slugs.
2. Let the engine publish articles per `CONTENT_RULES.md` so each notable IPO gets its analysis, subscription, allotment and listing article.
3. Keep internal markdown links in the same tab.
4. Add a listed-IPOs archive (for example `/ipos` filtered to Listed, or year pages) once the historical set grows.
5. Check Core Web Vitals in Search Console after launch.
