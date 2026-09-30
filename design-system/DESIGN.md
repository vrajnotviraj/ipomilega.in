# IPO Milega design system

Direction **C1 "Market green"**. This file is the source of truth for how ipomilega.in looks and reads. When a rule here conflicts with existing code, the rule wins and the code gets updated.

- Tokens: [`tokens.css`](tokens.css)
- Logo files: [`logo/`](logo)
- Visual board with the rejected options: [`brand-board.html`](brand-board.html). Open it in a browser. Only the C1 board applies.

## 1. Brand

| | |
|---|---|
| Audience | Indian retail investors, mostly on phones, bidding through their broker's UPI flow |
| Promise | You know whether an IPO is worth it, and your odds, before you bid |
| Core idea | "Milega?" Will I get it? |
| Tagline | **Milega? Check first.** |
| Personality | Bold, plain-spoken, a little cheeky. Never hype. |
| Avoid | Tip-channel hype, casino energy, crypto neon, paper-and-serif nostalgia |

## 2. Logo

**Mark:** three candlesticks on a shared base that read as an M. The first opens tall, the second dips, and the third, in marigold, closes above where the first opened. That's the listing-day breakout.

| File | Use |
|---|---|
| `logo/mark.svg` | Default, on chalk or white |
| `logo/mark-reversed.svg` | On the ink green, for example the ticker and dark panels |
| `logo/app-icon.svg` | Favicon, apple-icon and social avatar. Ink tile with chalk candles. |
| `logo/app-icon-marigold.svg` | Secondary icon, for promo tiles only |

**Geometry** (64-unit grid): candle bodies are 12 wide with radius 3. Wicks are 2.5 wide with round caps. Bodies sit at x = 8, 26 and 44. The marigold candle is always the rightmost one.

**Wordmark:** `IPO Milega` in Schibsted Grotesk. "IPO" is Black (900) and "Milega" is Medium (500), both in ink green. The contrast comes from weight only. Tracking is -0.045em.

**Rules**
- Clear space is the width of one candle body on every side.
- Minimum size is 16px for the mark. Below 24px, drop the wicks and use the app-icon form.
- Never recolour the candles, add a gradient, rotate, outline, or tint "Milega". The only colours are ink green, chalk and marigold.

## 3. Colour

One ink and one accent. Data colours are separate and only mean up, down or caution.

| Token | Hex | Role |
|---|---|---|
| `--foreground`, `--primary`, `--brand-mark` | `#0F3B2E` | **Market green.** Text, headings, logo, primary buttons, ticker background |
| `--brand-accent` | `#F0A92E` | **Marigold.** Fills only: the breakout candle, "today" chips, the arrow circle in the main CTA, the underline on highlighted words |
| `--background` | `#FAFAF6` | **Chalk.** The page |
| `--card`, `--popover` | `#FFFFFF` | Cards and inputs |
| `--secondary`, `--muted`, `--accent` | `#EEF1EA` | **Surface.** Quiet panels, hover fills, tab strips |
| `--muted-foreground` | `#5E6B63` | Secondary text, labels, captions |
| `--border`, `--input` | `#DCE2D8` | Hairlines |
| `--score-good` | `#1C7A4E` | Gains, scores above 6, odds 60% and up |
| `--score-mid` | `#94620C` | Scores above 3 up to 6, odds 25–59%. A text-safe amber, not marigold. |
| `--score-bad`, `--destructive` | `#B8452F` | Losses, scores 3 and below, odds under 25%, closing today |
| `--score-good-on-ink`, `--score-mid-on-ink`, `--score-bad-on-ink` | 45% of the data colour mixed into chalk | The same three data colours on the ink panel and ticker, where the plain ones are too dark to read |
| `--chart-1..5` | ink, gain, marigold, loss, muted | Chart series only. Revenue is chart-1, expense chart-5. Profit uses `--score-good` or `--score-bad`. |

**Rules**
- **Marigold is never text on chalk or white** (1.9:1). It's allowed as text only on ink green (6.2:1).
- Keep marigold to a small area (Itten's contrast of extension): at most one marigold element per card and per screen region.
- Gain green sits close to the brand green. Always pair a gain with its sign or arrow (`+38.23%`, ↑), so colour is never the only signal.
- Shadows are tinted with the ink (`rgb(15 59 46 / …)`), never black.
- Light theme only. The site has no theme toggle, so there is no dark palette to maintain.

**Contrast** (WCAG, all at least 4.5:1 for text):

| Pair | Ratio |
|---|---|
| Ink on chalk / white / surface | 11.9 / 12.5 / 10.9 |
| Muted on chalk / white / surface | 5.3 / 5.6 / 4.9 |
| Gain on chalk / white | 5.1 / 5.3 |
| Amber (`--score-mid`) on chalk | 5.0 |
| Loss on chalk / white | 5.1 / 5.3 |
| Chalk on ink, marigold on ink | 11.9 / 6.2 |

## 4. Typography

| Role | Family | Weights | Tailwind |
|---|---|---|---|
| Display | Schibsted Grotesk (variable) | 700 headings, 900 hero and wordmark | `font-display` |
| Body | Figtree (variable) | 400, 500, 600 | `font-sans` (default) |
| Figures | DM Mono | 400, 500 | `font-mono` |

Load all three with `next/font/google` in `app/layout.tsx`. Preload only Figtree, which is the LCP text; set `preload: false` on the other two. That's four font files in total: two variable, plus DM Mono's two weights.

**Scale** (mobile to desktop)

| Use | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| Hero (home band) | 32 → 40px | 900 | -0.035em | 0.95 |
| Page title (h1) | 44 → 60px | 900 | -0.035em | 0.95 |
| Section title (h2) | 32 → 44px | 700 | -0.03em | 1.05 |
| Card title | 18 → 20px | 700 | -0.015em | 1.2 |
| Body | 16px | 400 | 0 | 1.55 |
| Small | 14px | 400 / 500 | 0 | 1.5 |
| Label | 12px | 500 | +0.04em, uppercase allowed | 1.3 |
| Figure | 14–18px mono | 500 | 0, `tabular-nums` | 1.2 |

**Rules**
- Every number (prices, GMP, subscription, odds, dates, counts) is `font-mono tabular-nums`.
- Sentence case for headings and buttons. Uppercase only for short labels such as `MAINBOARD` and `LIVE`.
- No serif and no italics for emphasis. Highlight a phrase with ink plus a marigold underline (`text-decoration-color: var(--brand-accent)`, thickness 0.14em, offset 0.1em).
- Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty`. Keep body text under about 65 characters per line.
- `font-serif` is retired. Replace it with `font-display` when touching a file.

## 5. Space, shape and depth

- **Container:** `.app-container`, max 1280px, gutters 16 / 24 / 32px.
- **Spacing scale:** Tailwind's 4px scale. Card padding is 16–20px, the gap between cards is 16–24px, and home sections are `py-8 sm:py-12`, so stacked sections sit 64px apart on phones and 96px from sm.
- **Radius:** chips and buttons are full pills, cards 12px (`rounded-xl`), large panels 18px, inner tiles 8px. Nested radii shrink from the outside in.
- **Borders:** 1px `--border`. Cards have a border or a surface fill, never both plus a shadow.
- **Depth:** cards rest with `--shadow-card` and lift to `--shadow-lift` on hover (the `card-lift` utility).
- **Z-index:** content 0–10, sticky bars 40, header 50, overlays and sidebar 40–50, skip link 60, progress bar 60 (it takes no clicks, so it never covers the skip link). Nothing else.

## 6. Components

These are the site's existing patterns, restyled with the tokens above.

- **Hero:** compact band, not a full-screen opener. Tagline h1 with one highlighted phrase and a subline; open and upcoming counts as plain text on the right from lg. No CTA, no side panel and no announcement banner.
- **Header:** logo left and nav right. The active link uses `aria-current="page"` and the `underline-grow` utility.
- **Ticker:** full-bleed band on ink green. Company names in chalk, scores in data colours, and the reversed mark if a logo is needed. Pauses on hover; respects reduced motion.
- **Section heading:** display h2 on the left, "View all" link on the right as a pill or text link in `--primary`. The live badge is a `live-dot` plus the `LIVE` label in `--score-bad`.
- **Live IPO card:** white card with a 1px border, radius 12px and `card-lift`. Contents:
  - company logo and name
  - GMP, QIB and Total row in mono
  - allotment odds tiles, hidden until subscription numbers exist
  - issue size in the footer
  - no board badge, since the tabs already say Mainboard or SME
- **Closed IPO card:** same card. The allotment-today state gets a surface fill. "Check allotment" is a full pill: solid `--primary` when allotment is today, outlined otherwise.
- **Upcoming row:** list row with the `row-hover` tint, logo, name, open date, price band and score.
- **Buttons:**
  - Primary is a pill on `--primary` with chalk text, with the trailing arrow in a marigold circle.
  - Secondary is a pill with a 1px border.
  - Pressed state is `scale(0.98)`.
- **Chips:** pill, 12px text. The "today" chip is a marigold fill with ink text, and the live chip uses `live-dot`.
- **Empty state:** the shared `EmptyState` component. Dashed border in `--border`, surface icon tile, display title, one-line hint.
- **Score:** coloured by `getRiskTextColor`. In lists it is `ScorePill`, a mono `tabular-nums` pill with a smaller `/10` on an 11% tint of its own colour. On the analysis page the headline score is a display-700 figure. Shows a muted `–` when there is no analysis.
- **Status tiles (/ipos):** buttons with `aria-pressed`. The active tile is ink with chalk text. 2 columns on phones, 5 from sm.
- **Open now strip (/ipos):** surface panel, radius 18px, at most 6 cards closing soonest first, plus an "N more in the table below" line.
- **IPO table (/ipos):** a table from lg, stacked rows below. Columns: company, price band, issue size, GMP / listing, timeline, score.
- **Lifecycle track:** Open, Close, Allot and List as four dots on a line. Done is ink, today marigold, future hollow.
- **Analysis summary panel:** white 18px panel with the h1, score and verdict, headline figures and key facts.

## 7. Motion

- **Easing:** `--ease-out` for everything. Durations are fast (150ms) for colour, base (250ms) for hover, and slow (500ms) for reveals.
- **Properties:** only `transform` and `opacity`. No animating layout, `clip-path` or filters, and nothing that runs during page load above the fold (it pushes LCP back).
- **Existing utilities:**
  - `card-lift` (hover rise)
  - `live-dot` (ripple)
  - `underline-grow` (nav and tabs)
  - `row-hover` (list tint)
  - `.reveal` (CSS scroll-driven section entry; no JS)
- Everything is disabled under `prefers-reduced-motion: reduce`.

## 8. Voice

- Write from the investor's side: "Allotment today", "Closes tomorrow", "Your odds".
- Plain and specific. Use real numbers, and no exclamation marks.
- Errors say what happened and what to do: "Connection failed. Please try again."
- Never promise returns. Every analysis page keeps the not-investment-advice note.

## 9. Performance budget

Every design change has to keep these numbers:

- Homepage Lighthouse (mobile) performance must not drop below master's. Accessibility 100, best practices 100, SEO 100. CLS 0.
- CSS is inlined into the HTML (`experimental.inlineCss`), so every KB is paid on every page. Keep utilities compact and don't let Tailwind scan docs folders (see the `@source not` lines in `app/globals.css`).
- Charts (recharts) load through `next/dynamic` and stay out of the first-load bundle. Analytics load on idle.
- Four font files at most. Only the LCP font is preloaded.
- Animations are CSS only. Don't add a JS animation library.

## 10. Checklist for any UI change

- [ ] Every colour comes from a token in this file.
- [ ] Marigold is used only as a fill or on ink, in one small area.
- [ ] Numbers use mono with tabular figures.
- [ ] Headings use `font-display` in sentence case.
- [ ] Interactive elements have hover, pressed and `:focus-visible` states.
- [ ] Works at 360px wide with no horizontal scroll.
- [ ] Lighthouse compared against master before merging.
