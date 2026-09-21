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
npm run db:migrate          # creates the tables in your database
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
| `npm run db:generate` | Create a SQL migration from `src/db/schema.ts` changes |
| `npm run db:migrate` | Apply pending migrations (use this in production) |
| `npm run db:push` | Push the schema directly without a migration (local prototyping only) |

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

Email + password accounts with server-side sessions (no third-party auth service):

- Passwords are hashed with **scrypt** (`src/lib/auth/password.ts`); minimum 10 characters.
- Sessions live in the `sessions` table; the browser holds only a random token in an
  `httpOnly`, `SameSite=Lax` cookie, and the DB stores its SHA-256. Sign-out deletes the row.
- `requireUser()` (`src/lib/auth/current-user.ts`) guards every dashboard page **and** every
  server action. `/`, `/login`, `/signup` and public `/recap/[id]` pages are open.
- Provider tokens (Spotify, Apple) are encrypted at rest with AES-256-GCM using
  `TOKEN_ENCRYPTION_KEY`.
- **Guest mode** (`ALLOW_GUEST_LOGIN=true`) adds a passwordless shared account to the login
  page for local development. Never enable it in production.

Not included yet: email verification, password reset, rate limiting. See
`docs/PROJECT_STATUS.md`.

## Project layout

```
src/
  app/                 Next.js routes (App Router)
    (auth)/            /login and /signup
    actions/           Server Actions: auth, import, provider connect/sync, recaps
    api/               Route handlers: health check, Spotify OAuth callback, recap OG images
    dashboard/         Authenticated-area pages (overview, history, collection, settings, wrapped)
    recap/[id]/        Shareable recap (public, or owner-only if private)
    u/[handle]/        Public listener profile (opt-in)
  db/                  Drizzle schema + connection pool
  lib/
    auth/              password hashing, sessions, requireUser()
    crypto.ts          AES-GCM encryption for provider tokens
    listening.ts       Shared ListeningEvent type + normalisation helpers
    import-normalizer  Pure JSON-import parser (unit tested)
    analytics.ts       Pure statistics (unit tested)
    history-repo.ts    Batch insert with de-duplication, user-scoped delete
    providers/         Spotify / Last.fm / Apple API clients + normalisers
    wrapped-service.ts Yearly recap generation
  lib/__tests__/       Vitest unit tests
drizzle/               SQL migrations
docs/PROJECT_STATUS.md Audit, verified state, roadmap
```
