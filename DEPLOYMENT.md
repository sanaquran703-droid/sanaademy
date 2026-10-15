# SANA Quran Academy — Deployment Guide (Vercel + Supabase)

This document describes how to build, configure, and deploy the platform to **Vercel** with **Supabase PostgreSQL** and **Supabase Storage**.

> Never commit real secrets. `.env` is git-ignored; only `.env.example` (placeholders) is tracked.

---

## 1. Requirements

- Node.js 20+ (Next.js 15)
- A Vercel account with access to the GitHub repo
- A Supabase project (PostgreSQL + Storage bucket)
- The repository branch to deploy (production: `main`)

---

## 2. Environment variables

Configure these in **Vercel → Project → Settings → Environment Variables** (separately for Preview and Production). Names must match exactly.

| Variable | Scope | Where to get it |
|---|---|---|
| `DATABASE_URL` | Server | Supabase → Project Settings → Database → **Transaction Pooler** URI (port `6543`), with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Server | Supabase → Database → **Session/Direct** connection (port `5432`), used by `prisma migrate deploy` |
| `AUTH_SECRET` | Server | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — must be ≥ 32 chars |
| `SUPABASE_URL` | Server | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (secret) | Supabase → Project Settings → API → `service_role` key. **Never** expose to the browser |
| `SUPABASE_STORAGE_BUCKET` | Server | Bucket name for uploads (default `sana-uploads`) |
| `NEXT_PUBLIC_APP_URL` | Public | Production URL, e.g. `https://your-domain.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Public | Public WhatsApp contact number (digits only) |

Security notes:
- `SUPABASE_SERVICE_ROLE_KEY` and `AUTH_SECRET` are **server-only**. They must NOT be prefixed with `NEXT_PUBLIC_`.
- Rotate `AUTH_SECRET` invalidates all existing sessions (all users must log in again).

---

## 3. Supabase requirements

1. **Database:** copy both connection strings (pooled for runtime, direct for migrations). If the password contains special characters, URL-encode it.
2. **Connection pooling:** Vercel runs serverless functions; always use the **Transaction Pooler** for `DATABASE_URL` to avoid exhausting Postgres connections.
3. **Storage:** create a **private** bucket named `sana-uploads` (or set `SUPABASE_STORAGE_BUCKET`). The app uploads files server-side with the service-role key and issues short-lived **signed URLs** (15 min) — no public bucket policy is required.
4. **Migrations:** the initial schema lives in `prisma/migrations/0000_baseline`. Apply it once to a fresh database with `npx prisma migrate deploy` (see below).

---

## 4. Build & deploy

The repository defines a `vercel-build` script; Vercel runs it automatically:

```
prisma generate && next build
```

Steps:

1. Push the branch to GitHub.
2. In Vercel, **Import Project** from `sanaquran703-droid/sanaademy`.
3. Framework preset: **Next.js**. Root directory: repository root.
4. Build command: leave default (Vercel uses `vercel-build`).
5. Install command: `npm install` (lockfile is `package-lock.json`).
6. Add all environment variables (Section 2) for Production and Preview.
7. Apply database migrations **before first deploy** (one-off, from a machine with `DIRECT_URL` set):
   ```
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   ```
8. Deploy. A `vercel.json` is not required.

Local production build check:

```
npm ci
npx prisma generate
npm run build
```

---

## 5. Post-deployment smoke tests

Run these against the deployed URL:

1. `GET /` — landing page loads (Arabic RTL).
2. `GET /api/student/dashboard` without a cookie — returns **401 JSON** (not an HTML redirect).
3. Admin login at `/login/admin`, teacher at `/login/teacher`, student at `/login/student`.
4. Wrong password is rejected with a generic message; role mismatch is rejected server-side.
5. With a valid session, the matching dashboard loads; visiting another portal redirects to the correct dashboard.
6. Student uploads a payment proof → file appears in the `sana-uploads` bucket and the record shows `pending`.
7. Admin confirms the payment → student receives a notification.
8. Logout clears the session cookie and protected pages redirect to `/login`.
9. `mustChangePassword` accounts are forced to `/change-password`.

---

## 6. Rollback

- **Vercel:** redeploy a previous successful deployment (Deployments → … → *Promote to Production*). No code changes needed.
- **Environment variables:** keep the previous values; restoring an old `AUTH_SECRET` re-validates previously issued sessions (if still unexpired).
- **Database:** migrations are additive and applied with `prisma migrate deploy`. Never use `migrate reset`/`--force-reset` on production. Roll back schema changes with a new forward migration; restore data from a Supabase backup if needed.

---

## 7. Operational notes

- `next/font/google` fetches the **Tajawal** font at build time; the Vercel builder has network access. If the build environment blocks Google Fonts, self-host the font.
- Uploads go to Supabase Storage — there is no reliance on the local filesystem.
- Rate limiting for logins is stored in the `LoginAttempt` table (DB-backed), suitable for serverless.
