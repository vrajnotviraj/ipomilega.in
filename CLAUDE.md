# IPO Milega

Next.js 15 (App Router) + Tailwind v4 site for Indian IPO tracking and prospectus analysis.

## Design

Read `design-system/DESIGN.md` before any UI, styling, copy or logo change. It defines the colours, type, components, motion and performance budget. `design-system/tokens.css` holds the token values that `app/globals.css` should match.

## Code map

- `components/analysis/`: the IPO details page. `header/` is the sticky header and section tabs, `overview/` the top of the page (summary, timeline, odds, GMP, where the money goes), `sections/` the scored sections.
- `components/home/`: home page sections and the IPO cards.
- `components/ipos/`: the /ipos list page.
- `components/shareholder-quota/`: the /ipos/shareholder-quota page (hero, how it works, quota cards and stage track, FAQ) and its teaser on /ipos. Page copy lives in `content.ts`.
- `components/ipo-shared/`: pieces used on more than one page (logo, odds tiles, lifecycle steps and track).
- `lib/ipo-format.ts`: parsing and formatting of IPO data, in labelled sections. Kept as one file so the `*.check.mjs` scripts can run it under plain Node.
