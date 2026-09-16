# VINYL

A music-listening analytics and Wrapped-style recap platform. Import your Spotify listening
history, connect Last.fm or Spotify for ongoing syncs, and explore your data in an editorial,
archive-inspired interface.

> Project status, verified features, known issues and the roadmap live in
> [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions), React 19, TypeScript (strict)
- **Tailwind CSS v4**, Recharts, framer-motion, lucide-react
- **PostgreSQL** with **Drizzle ORM**
- **Vitest** for unit tests
- Fonts are self-hosted (Geist, Playfair Display) — no build-time calls to Google Fonts

## Getting started

```bash
cp .env.example .env        # then fill in DATABASE_URL (provider keys are optional)
npm install
npm run db:push             # creates / updates the tables in your database
npm run dev                 # http://localhost:3000
```

You need a running PostgreSQL 14+ instance. Any connection string works in `DATABASE_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run check` | typecheck + lint + test |
| `npm run db:push` | Push `src/db/schema.ts` to the database |

## Data sources — what each one can and cannot provide

VINYL never invents listening data. Each source has real limitations, and the UI labels them:

| Source | Timestamps | Durations | History depth | Notes |
|---|---|---|---|---|
| **JSON import** (Spotify data export) | ✅ exact | ✅ | Full history | The only way to get years of data. Re-importing is safe: existing plays are skipped. |
| **Spotify API** | ✅ exact | ✅ | Last **50** plays per sync | Spotify's API exposes no more than that. |
| **Last.fm** | ✅ exact | ❌ not reported | Last 200 scrobbles per sync | Listening-time totals are a *minimum* when Last.fm rows are present. |
| **Apple Music** | ❌ **not provided by Apple** | ✅ | "Recently played" list only | Each track is recorded once per sync day with an *estimated* time. Not a real play log. |

When the database is empty, pages show clearly labelled **demo data** that is never saved.

## Authentication

There is **no authentication yet**. Every visitor shares one guest account
(`guest@vinyl.audio`). All queries are already scoped by `userId` so that adding real
sign-in later does not require touching the data layer. Do not deploy publicly until
authentication is added.

## Project layout

```
src/
  app/                 Next.js routes (App Router)
    actions/           Server Actions: import, provider connect/sync, recaps
    api/               Route handlers: health check, Spotify OAuth callback
    dashboard/         Authenticated-area pages (overview, history, collection, settings, wrapped)
    recap/[id]/        Public, shareable recap page
  db/                  Drizzle schema + connection pool
  lib/
    listening.ts       Shared ListeningEvent type + normalisation helpers
    import-normalizer  Pure JSON-import parser (unit tested)
    analytics.ts       Pure statistics (unit tested)
    history-repo.ts    Batch insert with de-duplication, user-scoped delete
    providers/         Spotify / Last.fm / Apple API clients + normalisers
    wrapped-service.ts Yearly recap generation
  lib/__tests__/       Vitest unit tests
docs/PROJECT_STATUS.md Audit, verified state, roadmap
```
