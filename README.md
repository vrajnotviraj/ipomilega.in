# IPO Milega

A web app for tracking Indian IPOs. It shows what's live, upcoming and closed, tracks grey market premium (GMP) over time, and publishes a scored analysis for each issue.

It's built on Next.js 15 (App Router), TypeScript, MongoDB and Tailwind CSS. Auth is Better Auth with Google sign-in.

## What it does

- Lists live, upcoming, closed and past IPOs, split by mainboard and SME.
- Scores each IPO on fundamentals, risk, flexibility, performance and timing.
- Charts GMP history and financials with Recharts.
- Lets admins edit analysis fields in place (double-click a field) and write blog posts.
- Parses pasted prospectus text into a draft analysis through any OpenAI-compatible API.

The IPO data itself comes from separate scraper jobs that write straight to MongoDB. This repo is only the website, so on a fresh database you'll see empty lists until you load some `ipos` documents.

## Setup

You need Node.js 18+ and a MongoDB database (local or Atlas).

```bash
git clone <this-repo>
cd ipomilega.in
npm install
cp .env.example .env.local
```

Fill in `.env.local`. The required block is:

| Variable | What it's for |
| :--- | :--- |
| `MONGODB_URI`, `MONGODB_DB` | Your database |
| `BETTER_AUTH_SECRET` | Signs sessions. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `NEXTAUTH_URL` | The site's origin, `http://localhost:3000` locally |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth app |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin emails |

For Google OAuth, create a web client in the [Google Cloud console](https://console.cloud.google.com/apis/credentials) and add `http://localhost:3000/api/auth/callback/google` as a redirect URI (plus your production URL later).

Everything else in `.env.example` is optional. Skip S3 and uploads fail; skip OpenAI and the AI parser returns an error. The rest of the site still works.

Then create the indexes once and start the dev server:

```bash
node scripts/ensure-indexes.mjs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin access

Sign in with an email listed in `NEXT_PUBLIC_ADMIN_EMAILS` and you'll see the admin console at `/admin` plus inline edit controls on analysis pages.

The server checks this on every write, and it only trusts **verified** emails. Google sign-in counts as verified. Email/password sign-up doesn't verify anything, so an account made that way never gets admin rights, even with a matching address.

`NEXT_PUBLIC_ADMIN_EMAILS` is baked in at build time, so rebuild after you change it.

## Image uploads

Uploads go to S3 with a public-read ACL. Set the 4 `AWS_*` variables, then add your bucket's host to `images.remotePatterns` in `next.config.ts`, or Next.js will refuse to render the images.

## Background jobs

The scrapers call `POST /api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>` after they write, so cached pages refresh. If you don't run those jobs, leave `REVALIDATE_SECRET` empty and the endpoint stays shut.

## Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Dev server (builds into `.next-dev`) |
| `npm run build` | Production build |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint |
| `node scripts/ensure-indexes.mjs` | Creates the MongoDB indexes. Safe to re-run |
| `node scripts/make-ipos-live.js [n]` | Demo helper: moves n analysed IPOs into the Live bucket |

## Project layout

```
app/          Routes: pages, layouts, API handlers, OG images
components/   UI, grouped by area (home, ipo, admin, blog, charts, layout, ui)
hooks/        React hooks
lib/          Server helpers: Mongo, auth, S3, queries, formatting
types/        Data models
scripts/      Maintenance scripts
public/       Static assets
```

## Deploying

Any Node host that runs Next.js works (Vercel is the easy one). Set the same variables there, with `BETTER_AUTH_URL` and `NEXTAUTH_URL` pointing at your real domain, and add that domain's callback URL to your Google OAuth client.
