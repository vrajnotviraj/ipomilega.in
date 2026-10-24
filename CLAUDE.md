# IPO Milega

Next.js 15 (App Router) + Tailwind v4 site for Indian IPO tracking and prospectus analysis.

## Design

Read `design-system/DESIGN.md` before any UI, styling, copy or logo change. It defines the colours, type, components, motion and performance budget. `design-system/tokens.css` holds the token values that `app/globals.css` should match.

## Code map

- `app/[lang]/`: every page, once per language. English is served at the bare path through a rewrite in `next.config.ts`; `/hi` and `/gu` are Hindi and Gujarati. Each page and `generateMetadata` calls `setLocale(lang)` first.
- `lib/i18n/`: `locales.ts` (languages, `localePath`, hreflang, `fill` and `plural`), `server.ts` (`t()` and `locale()` for server components), `client.tsx` (`useT()`, `useLocale()` and the provider the layout renders). `messages/<lang>/<area>.json` hold the words, one file per site area; `messages/index.ts` types Hindi and Gujarati against English, so a missing key fails the build. `messages/messages.check.mjs` checks that every Hindi and Gujarati key exists in English and keeps its {placeholders}.
- `lib/queries/translations.ts`: the engine's translated analysis and article text, laid over the English document with `localize`.
- `components/analysis/`: the IPO details page. `header/` is the sticky header and section tabs, `overview/` the top of the page (summary, timeline, odds, GMP, where the money goes), `overview/add-to-calendar/` the timeline's Add to calendar button, `sections/` the scored sections.
- `components/home/`: home page sections and the IPO cards.
- `components/ipos/`: the /ipos list page. `model/` holds the row types, cell values, per-status sort and quick-filter table (`views.ts`), filtering and URL params; `filters/` the status tiles, search/board/sort/quick-filter bar and URL sync; `table/` the sortable table, pager and score pill; `open-now/` the strip of open IPOs. `views.check.mjs` checks sorting and quick filters.
- `components/shareholder-quota/`: the /ipos/shareholder-quota page (hero, how it works, quota cards and stage track, FAQ) and its teaser on /ipos. Page copy lives in `messages/<lang>/quota.json`.
- `components/planner/`: the /ipos/planner page. `PlannerClient` holds the inputs and lays out the form, verdict, day-by-day bids, money timeline and left-out list, one file each. `usePlan` waits for a typing pause, then asks `/api/planner` (deep search, cached a day in `lib/queries/planner.ts`) while `PlanLoader` shows.
- `components/ipo-shared/`: pieces used on more than one page (logo, odds tiles, lifecycle steps and track). `lifecycle.check.mjs` checks the timeline caption the steps pick.
- `lib/ipo/format.ts`: parsing and formatting of IPO data, in labelled sections. It has no runtime imports, so `*.check.mjs` scripts run it under plain Node.
- `lib/ipo/planner/`: the IPO planner. `days.ts` counts working days, `ipo.ts` turns an IPO into bid options and dates, `plan.ts` picks the bids. `plan.check.mjs` checks it against brute force.
- `lib/ipo/calendar/`: the Add to calendar export. `events.ts` turns an IPO's dates into events, `ics.ts` writes the .ics file, `google.ts` builds Google Calendar links. `calendar.check.mjs` checks them.
- `lib/ipo/score.ts`: the IPO score: section-score mean, QIB adjustment, score bands and colours. It imports `@/lib/ipo/format`, so `score.check.mjs` registers a resolve hook for `@/` paths.
