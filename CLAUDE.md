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
- `components/subscribe/`: the IPO alerts popup (opens 6s into a visit; `?alerts` opens it at once) and the /unsubscribe status.
- `lib/subscribers/`: the `subscribers` collection. `signup.ts` holds the rules (email and Indian mobile checks, which doc a signup writes) with no runtime imports, checked by `signup.check.mjs`; `store.ts` does the Mongo writes.
- `lib/email/`: the welcome mail. `welcome-email.ts` renders it (tables and inline styles, C1 tokens as hex), `welcome.ts` fills it with live IPOs and sends it over SMTP. Preview it at `/api/email-preview` in dev.
- `lib/ipo-format.ts`: parsing and formatting of IPO data, in labelled sections. It has no runtime imports, so `*.check.mjs` scripts run it under plain Node.
- `lib/ipo-score.ts`: the IPO score: section-score mean, QIB adjustment, score bands and colours. It imports `@/lib/ipo-format`, so `ipo-score.check.mjs` registers a resolve hook for `@/` paths.
