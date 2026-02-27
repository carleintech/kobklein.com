# KobKlein — Deployment Guide

## Architecture Overview

| Domain | App | Platform | Root directory |
|---|---|---|---|
| `kobklein.com` | Marketing site | Vercel | `apps/web-public` |
| `app-kobklein.com` | Web app (client/merchant/distributor) | Vercel | `apps/web` |
| `admin-kobklein.com` | Admin dashboard | Vercel | `apps/admin` |
| `api.app-kobklein.com` | NestJS REST API | Railway | `apps/api` |

DNS is managed on Cloudflare. All domains were purchased at cloudflare.com.

---

## 1. Supabase (Database + Auth + Realtime)

Before deploying anything, run the pending SQL migrations in the **Supabase SQL Editor** (`Project → SQL Editor`):

**Phase 9 migration** (`apps/api/prisma/migrations/20260222000001_phase9_geo_physcard/migration.sql`):

- Adds `lat`/`lng` to Merchant + Distributor
- Creates `PhysicalCardRequest` table

**Phase 10 migration** (`apps/api/prisma/migrations/20260222000002_phase10_local_payment/migration.sql`):

- Creates `LocalPaymentTxn` table
- Enables Supabase Realtime on `Wallet` + `Notification` tables

**Phase 14 migration** (`apps/api/prisma/migrations/20260223000001_phase14_support_tickets/migration.sql`):

- Creates `SupportTicket` table (user support requests + admin resolution workflow)
- Creates `PartnerLead` table (partner/investor interest capture from web-public)
- All statements are `IF NOT EXISTS` — safe to re-run

---

## 2. Railway — API Deployment

### 2.1 First-time setup

1. Go to [https://railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the `kobklein` repository
3. Set **Root Directory** to `apps/api`
4. Railway auto-detects NIXPACKS and runs `npm run build` (which runs `prisma generate && nest build`)

### 2.2 Environment Variables

In Railway project → **Variables**, add all variables from `apps/api/.env.example`:

```
DATABASE_URL          (Supabase transaction pooler URL)
SUPABASE_URL
SUPABASE_SERVICE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC
STRIPE_PRICE_PRO
STRIPE_PRICE_ENTERPRISE
MONCASH_CLIENT_ID
MONCASH_CLIENT_SECRET
MONCASH_BASE_URL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM
RESEND_API_KEY
RESEND_FROM
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL
REDIS_URL
SENTRY_DSN
```

> Railway sets `PORT` automatically — do not add it manually.

### 2.3 Custom Domain

1. Railway project → **Settings** → **Domains** → **Add Custom Domain**
2. Enter: `api.app-kobklein.com`
3. Railway shows a CNAME target (e.g., `xyz.up.railway.app`)
4. Add this in Cloudflare DNS (see Section 4)

### 2.4 Verify

```bash
curl https://api.app-kobklein.com/health
# Expected: {"status":"ok","service":"kobklein-api","uptime":...}
```

---

## 3. Vercel — Three Next.js Apps

Each app is deployed as a **separate Vercel project** (not a monorepo single deploy).

### 3.1 Deploy `kobklein.com` (web-public)

1. [https://vercel.com/new](https://vercel.com/new) → Import Git repository → `kobklein`
2. **Root Directory**: `apps/web-public`
3. **Framework Preset**: Next.js (auto-detected)
4. Add environment variables from `apps/web-public/.env.example`
5. Deploy → get the Vercel project URL (e.g., `kobklein-web-public.vercel.app`)
6. **Settings → Domains** → Add `kobklein.com` and `www.kobklein.com`

### 3.2 Deploy `app-kobklein.com` (web)

1. New Vercel project → Import same repo
2. **Root Directory**: `apps/web`
3. Add environment variables from `apps/web/.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_API_URL=https://api.app-kobklein.com
   NEXT_PUBLIC_VAPID_PUBLIC_KEY
   ```
4. **Settings → Domains** → Add `app-kobklein.com`

### 3.3 Deploy `admin-kobklein.com` (admin)

1. New Vercel project → Import same repo
2. **Root Directory**: `apps/admin`
3. Add environment variables from `apps/admin/.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_API_BASE_URL=https://api.app-kobklein.com
   ```
4. **Settings → Domains** → Add `admin-kobklein.com`

---

## 4. Cloudflare DNS

For each domain, go to **Cloudflare Dashboard → kobklein.com → DNS → Add record**.

### 4.1 `kobklein.com` → Vercel

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS only (grey cloud) |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS only (grey cloud) |

> Vercel requires DNS-only (not proxied) to issue their SSL certificates.

### 4.2 `app-kobklein.com` → Vercel

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS only (grey cloud) |

### 4.3 `admin-kobklein.com` → Vercel

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS only (grey cloud) |

### 4.4 `api.app-kobklein.com` → Railway

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `api` | `[your-service].up.railway.app` | DNS only (grey cloud) |

> Go to your Railway project → Settings → Domains to get the exact Railway target URL.

---

## 5. Stripe Webhook — Update After Deploy

After deploying the API, update your Stripe webhook endpoint:

1. [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Edit existing webhook (or create new) → set URL to:
   `https://api.app-kobklein.com/webhooks/stripe`
3. Copy the new `whsec_...` signing secret → update `STRIPE_WEBHOOK_SECRET` in Railway

---

## 6. Post-Deploy Checklist

```
[ ] Run Phase 9 SQL migration in Supabase SQL Editor
[ ] Run Phase 10 SQL migration in Supabase SQL Editor
[ ] Run Phase 14 SQL migration in Supabase SQL Editor
[ ] curl https://api.app-kobklein.com/health → {"status":"ok"}
[ ] Open https://kobklein.com → marketing site loads
[ ] Open https://app-kobklein.com → login page loads
[ ] Open https://admin-kobklein.com → admin login loads
[ ] Test signup flow on app-kobklein.com → welcome email received
[ ] Update Stripe webhook URL to https://api.app-kobklein.com/webhooks/stripe
[ ] Test a MonCash sandbox payment (set MONCASH_BASE_URL to sandbox URL)
[ ] Verify Supabase Realtime: Supabase Dashboard → Realtime → Wallet + Notification shown as "Listening"
[ ] Set MONCASH_BASE_URL to production URL when ready for live payments
```

---

## 7. Local Development

```bash
# Install all dependencies
pnpm install

# Start all apps simultaneously
pnpm dev

# Individual apps:
pnpm --filter api dev          # http://localhost:3001
pnpm --filter web dev          # http://localhost:3003
pnpm --filter web-public dev   # http://localhost:3000
pnpm --filter admin dev        # http://localhost:3002
```

Copy `.env.example` to `.env` (API) or `.env.local` (Next.js apps) and fill in values.

---

## 8. CI/CD

GitHub Actions runs automatically on every push and PR:

- **Lint & type check** (`lint-typecheck` job) — checks all apps
- **Unit tests** (`test-api` job) — runs 29 API unit tests
- **Build check** (`build-check` job) — verifies the API compiles

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

Vercel and Railway deploy automatically from the `main` branch via their GitHub integrations.
