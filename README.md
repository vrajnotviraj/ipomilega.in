# IPO Milega

A read-only web app for tracking Indian IPOs. It shows what's live, upcoming and closed, tracks grey market premium (GMP) over time, and shows a scored analysis and blog posts for each issue.

It's built on Next.js 15 (App Router), TypeScript, MongoDB and Tailwind CSS. There is no login: every page is public.

## What it does

- Lists live, upcoming, closed and past IPOs, split by mainboard and SME.
- Shows each IPO's score on fundamentals, risk, flexibility, performance and timing.
- Charts GMP history and financials with Recharts.
- Serves published blog posts.

Everything that writes data (scrapers, AI analysis, the admin panel and blog editor) lives in the separate `ipomilega-engine` service. On a fresh database you'll see empty lists until the engine loads some `ipos` documents.

## Setup

You need Node.js 20+ and a MongoDB database (local or Atlas).

```bash
git clone <this-repo>
cd ipomilega.in
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local`:

| Variable | What it's for |
| :--- | :--- |
| `MONGODB_URI`, `MONGODB_DB` | Your database |
| `REVALIDATE_SECRET` | Lets the engine refresh cached pages. Empty keeps the endpoint shut |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Optional analytics |

Open [http://localhost:3000](http://localhost:3000).

## Cache refresh

The engine calls `POST /api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>` after it writes, so cached pages refresh.

## Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Dev server (builds into `.next-dev`) |
| `npm run build` | Production build |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint |

## Project layout

```
app/          Routes: pages, layouts, read-only API handlers, OG images
components/   UI, grouped by area (home, ipo, blog, charts, layout, ui)
hooks/        React hooks
lib/          Server helpers: Mongo, queries, formatting
types/        Data models
public/       Static assets
```

## Deploying

Any Node host that runs Next.js works (Vercel is the easy one). Set the same variables there.
