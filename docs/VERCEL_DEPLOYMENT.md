# Deploying VINYL to Vercel

This guide walks you through linking and deploying VINYL to [Vercel](https://vercel.com) using the GitHub integration.

---

## 1. Prerequisites

Before deploying to Vercel, make sure you have:
1. A **Vercel account** ([vercel.com/signup](https://vercel.com/signup)).
2. A **PostgreSQL database (14+)** accessible over the internet:
   - [Neon](https://neon.tech) (Recommended for serverless Vercel deployments)
   - [Supabase](https://supabase.com)
   - [Railway](https://railway.app)
   - Any PostgreSQL instance with SSL enabled (`sslmode=require`).

---

## 2. Link the Repository in Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project** (or visit [vercel.com/new](https://vercel.com/new)).
3. Under **Import Git Repository**, select your GitHub account and locate `vinyl` (e.g. `ayinlaaaa/vinyl`).
4. Click **Import**.

---

## 3. Configure Project Settings

Vercel will automatically detect the **Next.js** framework preset.

- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (leave default)
- **Build Command**:
  - Default: `npm run build`
  - To automatically apply database migrations on each production build, you can override this to:
    ```bash
    npm run build:migrate
    ```

---

## 4. Environment Variables

Expand the **Environment Variables** section and configure the following:

### Required Variables

| Name | Description | Example / Notes |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/vinyl?sslmode=require` |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key (Base64) for encrypting provider tokens at rest | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

### Recommended Variables

| Name | Description | Example / Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public production URL (for Open Graph recap cards and share links) | `https://vinyl.vercel.app` (defaults to `https://${process.env.VERCEL_URL}` if omitted) |
| `ALLOW_GUEST_LOGIN` | Shared passwordless demo guest account | Leave empty or set to `false` in production. |

### Optional Provider Integrations

| Name | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify App Client ID from developer dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify App Client Secret |
| `SPOTIFY_REDIRECT_URI` | `https://<your-vercel-domain>/api/auth/spotify/callback` |
| `LASTFM_API_KEY` | Last.fm API Key |
| `APPLE_DEVELOPER_TOKEN` | Apple MusicKit Developer JWT |

> **Spotify Note**: If using Spotify sync, update your Spotify Developer Dashboard with the production redirect URI: `https://<your-domain>/api/auth/spotify/callback`.

---

## 5. Apply Database Migrations

Your PostgreSQL database must have the schema tables applied. You have two options:

### Option A: Automatic on Build (Recommended)
In Vercel Project Settings → **Build & Development Settings**, set the **Build Command** to:
```bash
npm run build:migrate
```
This runs `drizzle-kit migrate` before `next build` on each deployment.

### Option B: Run Migrations from Your Local Machine
Run the migration script once against your production connection string:
```bash
DATABASE_URL="postgresql://user:password@..." npm run db:migrate
```

---

## 6. Deploy & Verify

1. Click **Deploy**.
2. Once the build finishes, visit your Vercel URL (e.g. `https://<project-name>.vercel.app`).
3. Verify that `/api/health` returns `{"ok":true}`.
4. Create an account via `/signup` and test importing or viewing your recap!
