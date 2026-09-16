# VINYL — Project Status

_Initial audit: 2026-09-16 against commit `6c8e0e5`. Updated after **Phase 9 Part 1** on the same day._

## 0. Changelog

### Phase 9 Part 1 — Production Hardening: data integrity & correctness (2026-09-16) ✅

Fixed (all verified against a real PostgreSQL database):

- `/recap/[id]` public page now works (`params` awaited; Next 16 requirement).
- JSON import: typed + validated normaliser (`src/lib/import-normalizer.ts`); float `ms_played` values are rounded; bad rows are counted and reported with reasons instead of being swallowed as "success".
- De-duplication: unique index on `(user_id, external_id)` + batch `INSERT … ON CONFLICT DO NOTHING` (`src/lib/history-repo.ts`). Re-importing a file inserts 0 rows. All three provider syncs use the same path (N+1 queries removed).
- `clearAllData` is scoped to the current user and now also clears recaps and provider connections, matching its copy.
- All data-service queries filter by `userId`.
- Spotify: token refresh uses `expires_in`; refresh-token rotation handled; OAuth `state` cookie added (CSRF); typed token/profile responses.
- Last.fm: durations stored as `null` (not 0); "now playing" skipped; API error bodies handled; single-track responses handled.
- Apple Music: stable per-day external id (no more `Date.now()` ids); UI copy states plainly that Apple provides no timestamps.
- Analytics moved to `src/lib/analytics.ts` (out of `mock-data.ts`); track key no longer breaks on titles containing `" - "`; `playsWithoutDuration` tracked so listening time is labelled as a minimum when relevant.
- Dashboard: fake `+12.5% / -2.1%` trends removed; sidebar highlights the real active route; decorative search/bell/avatar/sign-out removed (nothing behind them).
- Wrapped: no JSX inside try/catch; recap requires ≥ 10 plays; shows data sources and estimate warnings.
- Landing: dead `/auth/signup` and `/demo` links repointed.
- Fonts self-hosted (`geist` package + bundled Playfair Display woff2) — `next build` no longer needs Google Fonts.
- Repo hygiene: `.gitignore`, `.env.example`, `README.md`, `drizzle.config.ts` reads `DATABASE_URL`, `package-lock.json` committed, package renamed to `vinyl`.
- Tooling: ESLint 0 errors, `tsc` 0 errors, `next build` passes, **Vitest added with 20 unit tests** (`npm test`).

Not yet done (see §8 for the updated plan): authentication, encrypted token storage, timezone handling, Last.fm backfill pagination, amber accent / responsive sidebar.

This document records what **actually exists and works** in the VINYL repository, verified by
reading every source file, running the type checker, linter, dev server and a local PostgreSQL
database, and probing the database directly. Where a claim below says "verified", it was tested
in this audit; where it says "unverified", it could not be tested (usually because it requires a
third-party credential we do not have).

---

## 1. Actual technology stack

The handover brief mentioned React + Vite + Express + Supabase. **That is not what is in the
repository.** The real stack is:

| Layer | What is used | Notes |
|---|---|---|
| Framework | **Next.js 16.2** (App Router, Turbopack, React 19) | Server Components + Server Actions; there is no separate Express API |
| Language | TypeScript 5.9, `strict: true` | `tsc --noEmit` passes with 0 errors |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme`) + CSS variables | No CSS modules / styled-components |
| Fonts | `next/font/google`: Geist, Geist Mono, Playfair Display | Downloaded at build time from Google Fonts |
| Charts | Recharts 3 | Used only in `DashboardCharts.tsx` |
| Animation | framer-motion 13 | Used only in the Wrapped story |
| Icons | lucide-react | |
| Database | **PostgreSQL** via `pg` + **Drizzle ORM 0.45** | Not Supabase. Schema pushed with `drizzle-kit push` |
| Auth | **None** | A single hard-coded `guest@vinyl.audio` user is created on first request. All queries are now `userId`-scoped in preparation. |
| Tests | **Vitest** | 20 unit tests covering import normalisation, dedup keys and analytics |
| CI / Docker / deploy config | **None** | |

The original upload had no `.gitignore`, README, `.env.example` or lockfile, and the Git history
is a single "Add files via upload" commit, so the Phase 0–8 history is not recoverable from Git.
These hygiene items were added in Phase 9 Part 1.

---

## 2. Feature inventory — as found at the original audit

> Items marked **[fixed P9.1]** were resolved in Phase 9 Part 1; the rest are still open.

Legend: ✅ verified working · ⚠️ partially working / has bugs · ❌ broken or missing · ❔ unverified (needs credentials)

### Pages / routes

| Route | Status | Notes |
|---|---|---|
| `/` landing page | ⚠️ | Renders. Two CTAs linked to `/auth/signup` and `/demo`, both 404 **[fixed P9.1 — repointed]**. Footer social links go to `#`. |
| `/dashboard` overview | ⚠️ | Renders. Shows stats, weekly chart, top artists, recent plays, saved recaps. Displayed hard-coded fake trends `+12.5%` / `-2.1%` **[fixed P9.1 — removed]**. "DEMO MODE" label appears when DB is empty. |
| `/dashboard/history` | ✅ | Renders last 100 plays with client-side search. Falls back to mock data with an `isMock` flag. |
| `/dashboard/collection` | ⚠️ | Renders artists by play count with grid/list toggle. **"Sort" button does nothing.** |
| `/dashboard/settings` | ✅ | Renders Spotify / Apple Music / Last.fm connection cards, JSON import, danger zone. |
| `/dashboard/wrapped` | ✅ | Generates the current-year recap from the DB; shows a clear "Not enough data yet" state when empty (verified). |
| `/recap/[id]` public recap | ✅ **[fixed P9.1]** | Was: always returned 404, even for a public recap (verified with a real row). Cause: Next.js 16 passes `params` as a `Promise`; the page reads `params.id` synchronously. Sharing links are therefore broken. |
| `/api/health` | ✅ | Returns `{ ok: true }` when the DB is reachable. |
| `/api/auth/spotify/callback` | ❔ | Code looks correct; needs Spotify credentials to test. |
| `/api/og/recap` | ❌ | Referenced in recap Open Graph metadata but the route **does not exist**. |

### Dashboard shell (`dashboard/layout.tsx`)

- Sidebar "Overview" was always highlighted **[fixed P9.1 — `SidebarNav` uses `usePathname`]**.
- Header search / bell / avatar / "Sign Out" were decorative only **[fixed P9.1 — removed until real features exist]**.
- ❌ Sidebar is fixed 256px wide with no mobile/collapsed layout; the dashboard is not usable on small screens.

### Data pipeline

| Area | Status | Notes |
|---|---|---|
| DB schema (`users`, `music_providers`, `listening_history`, `recaps`) | ✅ | Pushes cleanly. |
| Deduplication | ✅ **[fixed P9.1]** | Was: `external_id` has **no unique index** (verified: two identical rows insert fine). Sync code does a `findFirst` per track (N queries) and the import path does no check at all → re-importing the same file **doubles every statistic**. |
| JSON import (`actions/import.ts`) | ✅ **[fixed P9.1]** | Was: Accepts Spotify "extended streaming history" field names. Input is `any[]`, unvalidated. **Float `ms_played` values crash the insert** (`duration_ms` is `integer`; verified: `invalid input syntax for type integer`). Errors are swallowed silently, so the UI reports "Successfully imported 0 tracks" instead of an error. The "Generate Sample Data" button produces float durations and therefore silently imports nothing. |
| `clearAllData` | ✅ **[fixed P9.1]** | Was: Runs raw `DELETE FROM listening_history` with **no user filter** — deletes every user's history. Also does not clear providers or recaps despite the UI saying it will. |
| Multi-user isolation | ✅ **[fixed P9.1]** | Was: `getDashboardData`, `getHistoryData`, `getCollectionData` query `listening_history` **without a `userId` filter**. Harmless today (single guest user) but must be fixed before any auth is added. |
| Spotify provider | ❔ | OAuth code flow, refresh, `recently-played` (max 50 items per call — this is a real Spotify API limit, so full history is impossible without file import). Refresh handler read `expires_at` instead of `expires_in` **[fixed P9.1]**. OAuth `state` added **[P9.1]**. |
| Last.fm provider | ❔ | Username-based, needs `LASTFM_API_KEY`. Fetches 100 most recent scrobbles only (no pagination / backfill). **Last.fm gives no track duration, so `durationMs` is `NULL`** → listening-time totals silently under-count Last.fm users. Whole raw track object is stored in `metadata`. |
| Apple Music provider | ⚠️ (inherent API limit) | Uses MusicKit JS + `me/recent/played/tracks`. **That endpoint returns no play timestamps**; the code stamps every track with `new Date()` and a `Date.now()`-based external id, so every sync fabricates "played now" events and dedup only checks by track *name*. Analytics from this source are **not trustworthy** and this should be labelled as such in the UI. Developer token is a static env var (no JWT signing). |
| Recaps (save / toggle public) | ⚠️ | Save + toggle work. `recaps.data` is cast `as any`. Public viewing is broken (see `/recap/[id]` above). |

### Analytics calculations (`mock-data.ts` → `getStats`, `wrapped-service.ts`)

- Plays = row count; minutes = `sum(duration_ms)`. Both **count every row equally**, so duplicate imports and Apple "fake now" rows inflate numbers.
- `getStats` is imported from `mock-data.ts` and used for real data too — naming is misleading.
- Weekly chart buckets by day-of-week in **server timezone** (`format(playedAt,"EEE")`); no user timezone handling.
- Listening time on the dashboard is rounded to whole hours; recap rounds to minutes. Neither distinguishes "estimated" from "verified" and neither flags rows with missing duration.
- Track identity uses the string key `"track - artist"` and then `split(" - ")[0]`, which breaks for any title containing `" - "` (e.g. remixes).
- "Listening Vibe" is computed from peak hour in server time.

### Design ("The Archive" direction)

- Existing: dark near-black theme (`#0a0a0a`), Playfair serif headlines, Geist mono, zinc greys, square corners. Good foundation, consistent across pages.
- **Missing: the VU-meter amber accent is not defined or used anywhere** (0 occurrences). Success/error states use Tailwind emerald/rose instead of the brand palette.
- Tailwind `font-playfair` utility is used 38 times but **never defined in `@theme`**; it only works today because Tailwind v4 happens to resolve it via the `--font-playfair` variable. Fragile; should be declared explicitly.
- Landing page includes a "Now Playing / 01" decorative block and a Tolstoy quote — fine, but the "Twitter / Instagram" footer links are dead.

---

## 3. Build, lint, type-check results

| Check | Result |
|---|---|
| `npm install` | OK (438 packages). A `package-lock.json` is generated but was **not committed**. |
| `tsc --noEmit` | ✅ 0 errors |
| `eslint .` | ✅ 0 errors **[fixed P9.1]** — was 5 errors: 4× `react/no-unescaped-entities` (landing page, Last.fm card, Wrapped story), 1× `react-hooks/error-boundaries` in `dashboard/wrapped/page.tsx` (JSX constructed inside `try/catch`). |
| `next build` | ✅ passes **[fixed P9.1 — fonts self-hosted]** — previously failed in this sandbox because `next/font/google` cannot reach `fonts.googleapis.com`. On a machine with internet it would build, but this is a real production risk: a Google Fonts outage would break deploys. Self-hosting the three fonts removes the dependency. |
| `next dev` | ✅ Runs; falls back to system fonts. |
| Tests | ✅ 20 Vitest unit tests **[added P9.1]** |

---

## 4. Security review

| Severity | Issue |
|---|---|
| **High** | No authentication at all. Anyone who can reach the app can connect providers, import data, delete data, and publish recaps under the shared guest account. This is acceptable for a local prototype but blocks any deployment. |
| ~~High~~ fixed P9.1 | `clearAllData` deleted every row for all users. Now user-scoped. |
| **Medium** | Provider access/refresh tokens and the Apple Music user token are stored **in plaintext** in `music_providers`. |
| ~~Medium~~ fixed P9.1 | Spotify OAuth flow had no `state` parameter. |
| ~~Medium~~ fixed P9.1 | `drizzle.config.json` hard-coded DB credentials. Now `drizzle.config.ts` reads `DATABASE_URL`. |
| ~~Low~~ fixed P9.1 | Last.fm stored the whole raw API object per row. Now stores nothing extra. |
| ~~Low~~ fixed P9.1 | No `.gitignore`. Added. |
| Good | Secrets are read from env vars only on the server; server actions never return secrets to the client (the Apple developer token is sent to the client by design — MusicKit requires it). |

---

## 5. Integration status summary

| Provider | Connect | Sync | Data quality | Blocker |
|---|---|---|---|---|
| JSON import | ✅ | — | ⚠️ crashes on float durations, no dedup | Fix validation |
| Spotify | ❔ | ❔ | Good (real timestamps + durations); only last 50 plays | Credentials; token refresh bug |
| Last.fm | ❔ | ❔ | Good timestamps, **no durations**; last 100 only | API key; needs duration strategy |
| Apple Music | ❔ | ❔ | **Poor** — no timestamps available from API | Should be labelled "recent library only", not history |

---

## 6. Database / auth / deployment readiness

- **Database:** Schema is sound but incomplete for production: no indexes on `(user_id, played_at)`, no unique constraint for dedup, no migrations folder (uses `push`).
- **Authentication:** Not implemented. Single guest user. All data-service queries need `userId` scoping before auth can be added safely.
- **Deployment:** Not ready. No `.env.example`, README, Dockerfile, CI, or health-check docs; build depends on Google Fonts at build time; several high-severity bugs above.

---

## 7. Known issues (remaining after Phase 9 Part 1)

1. **No authentication** — single shared guest account. Biggest blocker to deployment.
2. Provider tokens stored in plaintext in `music_providers`.
3. Weekday / hour buckets and the "listening vibe" use the **server's** timezone, not the user's.
4. Last.fm sync fetches only the latest 200 scrobbles; no backfill pagination.
5. Apple Music can never provide real play history (API limitation) — labelled, but consider hiding it behind an "experimental" flag.
6. Collection page "Sort" button does nothing; dashboard is not usable on small screens (fixed 256 px sidebar).
7. `/api/og/recap` social image endpoint does not exist (reference removed from metadata for now).
8. Design: amber accent from "The Archive" brief still unused; success/error states use generic emerald/rose.
9. No DB migrations folder — schema is applied with `drizzle-kit push`. Fine for now; generate migrations before the first real deployment.

## 8. Recommended next milestone: **Phase 9 Part 2 — Authentication & account boundaries**

Rationale: with the data layer now idempotent, validated and user-scoped, the remaining
blocker to any real deployment is that everyone shares one account. Proposed scope:

1. Add email-based sign-in (magic link or password) using a well-maintained library compatible with Next 16 — to be agreed before adding the dependency.
2. Replace `getOrCreateDefaultUser()` with a `getCurrentUser()` that reads the session; keep a dev-only guest fallback behind an env flag.
3. Encrypt provider tokens at rest (AES-GCM with a server-side key from env).
4. Protect `/dashboard/*` and all server actions; keep `/recap/[id]` public.
5. Generate the first Drizzle migration.

After that: **Phase 10 — Analytics accuracy** (user timezone, Last.fm backfill, artist-name
normalisation), then **Phase 11 — Wrapped polish** (amber accent, responsive layout,
reduced-motion, OG images).
