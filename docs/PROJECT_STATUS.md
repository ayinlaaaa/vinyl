# VINYL — Project Status

_Initial audit: 2026-09-16 against commit `6c8e0e5`. Updated after **Phase 11 — Wrapped polish**._

## 0. Changelog

### Phase 11 — Wrapped polish ✅

- VU-meter amber (`#e8b84a`, `text-vu` / `bg-vu`) is the Archive accent: recap chrome, charts, success states, landing CTAs. Destructive states use the theme `destructive` token instead of generic emerald/rose.
- Dashboard shell is responsive: sticky sidebar on desktop, overlay drawer + top bar on small screens. Landing header has a mobile menu. History table scrolls horizontally.
- Recap story honors `prefers-reduced-motion` (no disc spin, no slide scale, chart animation off). Global CSS short-circuits animations/transitions.
- Recap sharing: keyboard and swipe navigation; side tap zones no longer cover the save/share controls; owners can view private recaps; visitors no longer see “Save & Share”.
- Open Graph images at `/api/og/recap/[id]` (alias `/api/og/recap?id=`). Public recaps expose `og:image` / Twitter large-image cards. Private recaps are `noindex`.
- Public profiles: optional handle, `/u/[handle]`, profile visibility toggle, “new recaps start public” default. Profiles and recaps stay private until explicitly published. Direct recap links remain independent of profile visibility.
- Collection sort actually sorts (most/least played, name A–Z / Z–A). Account deletion (password + `DELETE` confirm) lives in the danger zone; the shared guest account cannot be deleted.
- Schema migration `drizzle/0002_phase11_profiles.sql`. Unit tests for handles, privacy rules, collection sort, OG payload parsing, and listening vibe.

### Phase 10 — Analytics accuracy ✅

- Accounts now store an IANA timezone (captured in the browser during sign-up and editable in Settings); weekday/hour buckets, yearly recap boundaries, and listening vibe use that timezone.
- Last.fm sync paginates `user.getrecenttracks` with a `from` boundary and backfills until the previous sync timestamp.
- Ingested artists and tracks carry canonical keys so casing and common release suffixes such as `(Remastered 2009)` and `- Radio Edit` do not split top lists.
- Dashboard, history, and recap use the same estimated-versus-verified timestamp notice; Apple Music remains explicitly estimated.
- Sign-in and sign-up have process-local IP and email rate limits.
- Added the Phase 10 schema migration and unit coverage for normalization and timezone boundaries.

### Phase 9 Part 2 — Authentication & account boundaries (2026-09-16) ✅

- Email/password sign-up and sign-in (`/signup`, `/login`), scrypt hashing, generic error messages (no account enumeration), `?next=` open-redirect protection.
- Server-side sessions table (`sessions`), opaque httpOnly cookie, SHA-256 token hash at rest, 30-day expiry, sign-out invalidates server-side.
- `requireUser()` replaces `getOrCreateDefaultUser()` in **every** dashboard page and server action (30 call sites); dashboard layout redirects to `/login`; auth pages redirect signed-in users to `/dashboard`; public recaps stay public.
- Spotify OAuth callback now requires a signed-in user and encrypts tokens; Apple Music user token encrypted; AES-256-GCM via `TOKEN_ENCRYPTION_KEY` with transparent fallback for pre-existing plaintext values.
- Guest mode gated behind `ALLOW_GUEST_LOGIN=true` (development only).
- First real Drizzle migration generated (`drizzle/0000_init.sql`); `db:generate` / `db:migrate` scripts.
- 9 new unit tests (password, crypto); an end-to-end flow (sign-up → data isolation → guest → sign-out → replayed cookie rejected) was run against the real database.
- Not included: email verification, password reset / recovery, "remember me" choice, account deletion UI.

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

Not yet done (see §8 for the updated plan): password recovery, email verification, amber accent / responsive sidebar, and CI.

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
| Fonts | Self-hosted Geist + Playfair Display | No Google Fonts at build time |
| Charts | Recharts 3 | Used only in `DashboardCharts.tsx` |
| Animation | framer-motion 13 | Used only in the Wrapped story |
| Icons | lucide-react | |
| Database | **PostgreSQL** via `pg` + **Drizzle ORM 0.45** | Not Supabase. Schema pushed with `drizzle-kit push` |
| Auth | **Email + password, server-side sessions** (P9.2) | scrypt, httpOnly cookie, `requireUser()` on every page/action. Optional dev-only guest mode. |
| Tests | **Vitest** | Unit tests: import normalisation, dedup keys, analytics, timezone, name normalisation, password hashing, token encryption, handles, privacy, collection sort, OG payload, vibe |
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
| `/` landing page | ✅ **[P11]** | Renders. CTAs go to `/signup` and `/login`. Mobile nav. Footer links to Features, Sign in, and the GitHub repo. |
| `/dashboard` overview | ⚠️ | Renders. Shows stats, weekly chart, top artists, recent plays, saved recaps. Displayed hard-coded fake trends `+12.5%` / `-2.1%` **[fixed P9.1 — removed]**. "DEMO MODE" label appears when DB is empty. |
| `/dashboard/history` | ✅ | Renders last 100 plays with client-side search. Falls back to mock data with an `isMock` flag. |
| `/dashboard/collection` | ✅ **[P11]** | Artists with grid/list toggle and a working sort control (plays / name). |
| `/dashboard/settings` | ✅ | Renders Spotify / Apple Music / Last.fm connection cards, JSON import, danger zone. |
| `/dashboard/wrapped` | ✅ | Generates the current-year recap from the DB; shows a clear "Not enough data yet" state when empty (verified). |
| `/recap/[id]` public recap | ✅ **[fixed P9.1]** | Was: always returned 404, even for a public recap (verified with a real row). Cause: Next.js 16 passes `params` as a `Promise`; the page reads `params.id` synchronously. Sharing links are therefore broken. |
| `/api/health` | ✅ | Returns `{ ok: true }` when the DB is reachable. |
| `/api/auth/spotify/callback` | ❔ | Code looks correct; needs Spotify credentials to test. |
| `/api/og/recap/[id]` | ✅ **[P11]** | 1200×630 recap card for public recaps; 404 when private or missing. Alias: `/api/og/recap?id=`. |
| `/u/[handle]` | ✅ **[P11]** | Opt-in public listener profile listing public recaps. 404 when private/unknown (same copy, no enumeration). |

### Dashboard shell (`dashboard/layout.tsx`)

- Sidebar "Overview" was always highlighted **[fixed P9.1 — `SidebarNav` uses `usePathname`]**.
- Header search / bell / avatar / "Sign Out" were decorative only **[fixed P9.1 — removed until real features exist]**.
- Sidebar is a drawer on small screens and sticky 256px on `md+` **[fixed P11]**.

### Data pipeline

| Area | Status | Notes |
|---|---|---|
| DB schema (`users`, `music_providers`, `listening_history`, `recaps`) | ✅ | Pushes cleanly. |
| Deduplication | ✅ **[fixed P9.1]** | Was: `external_id` has **no unique index** (verified: two identical rows insert fine). Sync code does a `findFirst` per track (N queries) and the import path does no check at all → re-importing the same file **doubles every statistic**. |
| JSON import (`actions/import.ts`) | ✅ **[fixed P9.1]** | Was: Accepts Spotify "extended streaming history" field names. Input is `any[]`, unvalidated. **Float `ms_played` values crash the insert** (`duration_ms` is `integer`; verified: `invalid input syntax for type integer`). Errors are swallowed silently, so the UI reports "Successfully imported 0 tracks" instead of an error. The "Generate Sample Data" button produces float durations and therefore silently imports nothing. |
| `clearAllData` | ✅ **[fixed P9.1]** | Was: Runs raw `DELETE FROM listening_history` with **no user filter** — deletes every user's history. Also does not clear providers or recaps despite the UI saying it will. |
| Multi-user isolation | ✅ **[fixed P9.1]** | Was: `getDashboardData`, `getHistoryData`, `getCollectionData` query `listening_history` **without a `userId` filter**. Harmless today (single guest user) but must be fixed before any auth is added. |
| Spotify provider | ❔ | OAuth code flow, refresh, `recently-played` (max 50 items per call — this is a real Spotify API limit, so full history is impossible without file import). Refresh handler read `expires_at` instead of `expires_in` **[fixed P9.1]**. OAuth `state` added **[P9.1]**. |
| Last.fm provider | ❔ | Username-based, needs `LASTFM_API_KEY`. Sync paginates and backfills to the previous sync boundary. **Last.fm gives no track duration, so `durationMs` is `NULL`** → listening-time totals are labelled as a minimum. |
| Apple Music provider | ⚠️ (inherent API limit) | Uses MusicKit JS + `me/recent/played/tracks`. **That endpoint returns no play timestamps**; the code stamps every track with `new Date()` and a `Date.now()`-based external id, so every sync fabricates "played now" events and dedup only checks by track *name*. Analytics from this source are **not trustworthy** and this should be labelled as such in the UI. Developer token is a static env var (no JWT signing). |
| Recaps (save / toggle public) | ⚠️ | Save + toggle work. `recaps.data` is cast `as any`. Public viewing is broken (see `/recap/[id]` above). |

### Analytics calculations (`mock-data.ts` → `getStats`, `wrapped-service.ts`)

- Plays = row count; minutes = `sum(duration_ms)`. Both **count every row equally**, so duplicate imports and Apple "fake now" rows inflate numbers.
- `getStats` is imported from `mock-data.ts` and used for real data too — naming is misleading.
- Weekly chart buckets, hourly activity, and recap vibe use the account's IANA timezone.
- Listening time on the dashboard is rounded to whole hours; recap rounds to minutes. Neither distinguishes "estimated" from "verified" and neither flags rows with missing duration.
- Track identity uses the string key `"track - artist"` and then `split(" - ")[0]`, which breaks for any title containing `" - "` (e.g. remixes).
- "Listening Vibe" is computed from peak hour in server time.

### Design ("The Archive" direction)

- Existing: dark near-black theme (`#0a0a0a`), Playfair serif headlines, Geist mono, zinc greys, square corners. Good foundation, consistent across pages.
- VU-meter amber is defined as `--color-vu` / `text-vu` / `bg-vu` and used for recap chrome, success, charts, and landing highlights **[P11]**.
- Tailwind `font-playfair` is declared in `@theme` **[P9.1 / P11]**.
- Landing page includes a "Now Playing / 01" decorative block, a VU meter, and a Tolstoy quote. Footer links to in-product destinations **[P11]**.

---

## 3. Build, lint, type-check results

| Check | Result |
|---|---|
| `npm install` | OK (438 packages). A `package-lock.json` is generated but was **not committed**. |
| `tsc --noEmit` | ✅ 0 errors |
| `eslint .` | ✅ 0 errors **[fixed P9.1]** — was 5 errors: 4× `react/no-unescaped-entities` (landing page, Last.fm card, Wrapped story), 1× `react-hooks/error-boundaries` in `dashboard/wrapped/page.tsx` (JSX constructed inside `try/catch`). |
| `next build` | ✅ passes **[fixed P9.1 — fonts self-hosted]** — previously failed in this sandbox because `next/font/google` cannot reach `fonts.googleapis.com`. On a machine with internet it would build, but this is a real production risk: a Google Fonts outage would break deploys. Self-hosting the three fonts removes the dependency. |
| `next dev` | ✅ Runs; falls back to system fonts. |
| Tests | ✅ 53 Vitest unit tests **[expanded P11]** |

---

## 4. Security review

| Severity | Issue |
|---|---|
| ~~High~~ fixed P9.2 | No authentication. Now email/password + sessions; every page and action guarded. |
| ~~High~~ fixed P9.1 | `clearAllData` deleted every row for all users. Now user-scoped. |
| ~~Medium~~ fixed P9.2 | Provider tokens were stored in plaintext. Now AES-256-GCM encrypted. |
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
- **Authentication:** Implemented (P9.2) with email/password, sessions, and auth rate limits. Missing for a public launch: password reset and email verification.
- **Deployment:** Close. Remaining: CI workflow, a production migration run (`npm run db:migrate`), and setting `TOKEN_ENCRYPTION_KEY`. No Dockerfile yet.

---

## 7. Known issues (remaining after Phase 11)

1. **No password reset or email verification** — requires an email provider (not yet chosen).
2. Apple Music can never provide real play history (API limitation) — labelled, but consider hiding behind an "experimental" flag.
3. No CI workflow runs `npm run check` on push. No Dockerfile yet.

## 8. Recommended next milestone: **Phase 12 — Launch ops**

Presentation and sharing are in place. Remaining for a public launch: choose an email provider and add password reset / verification, run `npm run db:migrate` in production with `TOKEN_ENCRYPTION_KEY` and `NEXT_PUBLIC_APP_URL` set, add a CI workflow, and (optionally) a Dockerfile.
