# SEO architecture

How ipomilega.in is laid out for search, and the rules new pages follow. `SEO_AUDIT.md` has the current state and open gaps. The rules for writing articles live in `CONTENT_RULES.md` in the engine repo.

## URL architecture

| Page | URL | Owns |
| --- | --- | --- |
| Home | `/` | IPO Milega, IPO GMP today, live IPOs |
| IPO list | `/ipos` | upcoming, open, closed and listed IPOs |
| IPO entity page | `/analysis/<ipo slug>` | "<Company> IPO" and its facts: price, dates, lot size, GMP, subscription |
| Article | `/blogs/<ipo slug>-ipo-<type>` | one search intent per IPO (see below) |
| Blog index | `/blogs` | the list of articles |
| About | `/about` | who publishes the site |

URLs never change once live. If one has to move, add a permanent redirect in `next.config.ts` to the closest page, never to the home page.

## Page types and intents

Each IPO has one entity page and up to four articles. Each article owns a different question:

| Type | Slug suffix | Question |
| --- | --- | --- |
| analysis | `-ipo-analysis` | Is this IPO worth a look? Business, financials, valuation, GMP, risks |
| subscription | `-ipo-subscription` | How much demand is there, by category and by day? |
| allotment | `-ipo-allotment` | When is allotment and how do I check it? |
| listing | `-ipo-listing` | How did it list against the issue price and GMP? |

There are no per-day or per-hour pages. A new subscription figure updates the existing subscription article.

## Canonical and indexing rules

- Every indexable page sets a self canonical through `alternates.canonical`.
- Query strings (`/ipos?status=open`, filters, sorting) canonicalise to the bare path.
- `robots.ts` blocks `/api/revalidate`, `/api/subscription` and `/ingest/`. `/api/ipo/*` stays crawlable because client charts read it.
- A missing IPO or draft article returns 404 or `noindex`, never a thin page.

## Metadata rules

- Titles are unique and say what the page answers: "<Company> IPO: GMP, Price, Dates, Lot Size & Allotment" for the entity page, and the article type's fixed title for articles.
- Descriptions summarise the page in one or two sentences. No keyword lists and no `keywords` meta.
- One H1 per page, matching the title's intent.
- OpenGraph and Twitter tags on every article and entity page.

## Internal linking rules

- Every article links to its IPO entity page (or `/ipos` until one exists) and to the other articles about the same IPO, under "More on <Company> IPO".
- The entity page lists every published article for that IPO under "Latest on <Company> IPO".
- Anchor text is the page title or a plain description, never "click here".
- Visible breadcrumbs: Home / IPOs / <Company> IPO, and Home / Blog / <title>.

## Structured data rules

- Root layout: one Organization and one WebSite node.
- Entity page: Article, BreadcrumbList, and an FAQ of facts that are shown on the page.
- Article page: BlogPosting with headline, description, image, datePublished, dateModified, author and publisher, plus BreadcrumbList.
- Engine articles are authored by the Organization "IPO Milega Research". Hand-written posts name a Person.
- Structured data only repeats what the page shows. No schema is added for rich results Google no longer shows.

## Sitemap rules

- `/sitemap.xml` lists only canonical, indexable URLs: static pages, entity pages and published articles, with `lastModified` from the real update time.
- `/news-sitemap.xml` lists engine news articles (subscription, allotment, listing) first published in the last 48 hours, as Google News requires.
- Drafts, 404s, redirects and filter URLs are never listed.

## IPO lifecycle

The engine derives a stage from the IPO's dates: UPCOMING, OPEN, FINAL_DAY, CLOSED, ALLOTMENT, LISTED. The stage decides which article is due next. An IPO page is never deleted after listing. It keeps its price, GMP history, subscription and listing figures as a permanent record.

## Content lifecycle

1. The engine reads IPO data from Mongo and builds a fact sheet.
2. It picks the IPO's next due article from its stage and an internal interest tier (high, normal, low).
3. The OpenAI Batch API writes the article from the fact sheet only.
4. Validation checks every number, link and phrase against the fact sheet. Articles that pass are published; the rest stay in draft for an editor.
5. The site is revalidated, so the sitemap, entity page links and news sitemap pick the article up.

An article's `updated_at` changes only when its text changes. Live figures on the page do not touch it.

## Article creation rules

- High interest: analysis, subscription (refreshed once per bidding day and once with the final figures), allotment, listing.
- Normal: analysis, subscription with the final figures, allotment, listing.
- Low interest (small SME with little demand): analysis only when an AI analysis exists, then allotment and listing.
- If a page already owns the intent, update it or skip. A hand-written analysis post for an IPO blocks an engine analysis for it.

## AEO principles

Answer engines use the same signals as search. So there is no separate AI content, no llms.txt, and no question stuffing. Each page answers its question in the first paragraph, uses clear headings and tables, labels GMP as an unofficial grey market indication with its time, names its sources and keeps the facts consistent with the entity page.

## Historical data strategy

GMP (`gmp_snapshots`) and subscription (`subscription_snapshots`) readings are stored as time series and never overwritten. Listing prices are kept on the IPO. These records feed the entity page charts and the articles. Later they can support GMP history, subscription history and listing performance pages, once there is enough data to make those pages useful.
