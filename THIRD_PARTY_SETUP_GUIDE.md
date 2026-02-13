# KobKlein — Third-Party Services Setup Guide

> Complete step-by-step instructions for configuring all external services.
> Follow this guide in order. Each section tells you exactly what to do,
> what credentials you'll get, and where to put them.

---

## TABLE OF CONTENTS

1. [Supabase (Database)](#1-supabase-database)
2. [Auth0 (Authentication)](#2-auth0-authentication)
3. [Stripe (Payments & Billing)](#3-stripe-payments--billing)
4. [Twilio (SMS Notifications)](#4-twilio-sms-notifications)
5. [Resend (Email Notifications)](#5-resend-email-notifications)
6. [Upstash Redis (Queue & Cache)](#6-upstash-redis-queue--cache)
7. [Sentry (Error Monitoring)](#7-sentry-error-monitoring)
8. [Expo EAS (Mobile Builds)](#8-expo-eas-mobile-builds)
9. [Domain & DNS](#9-domain--dns)
10. [Deployment Platform](#10-deployment-platform)

---

## 1. SUPABASE (Database)

**What it does:** Hosts your PostgreSQL database. Prisma connects to it.

### Steps:

1. Go to https://supabase.com and sign up / log in
2. Click "New Project"
3. Settings:
   - **Name:** `kobklein-production` (or `kobklein-dev` for development)
   - **Database Password:** Generate a strong password (SAVE IT — you won't see it again)
   - **Region:** Choose closest to Haiti (US East - N. Virginia recommended)
   - **Plan:** Free tier works for dev. Pro ($25/mo) for production.
4. Wait for project to provision (~2 minutes)

### Get Your Credentials:

5. Go to **Settings > Database**
   - Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - This is your `DATABASE_URL`

6. Go to **Settings > API**
   - Copy **Project URL** → this is your `SUPABASE_URL`
   - Copy **anon (public) key** → this is your `SUPABASE_ANON_KEY`
   - Copy **service_role (secret) key** → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Put in .env:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
```

### Initialize Database:

```bash
cd apps/api
npx prisma db push    # Creates all tables from schema
npx prisma generate   # Generates Prisma client
```

### For Production:
- Create a SEPARATE Supabase project (don't share dev/prod)
- Enable **Row Level Security** on sensitive tables
- Set up **daily backups** (Supabase Pro plan includes this)
- Use **connection pooling** (Supabase provides PgBouncer on port 6543)

---

## 2. AUTH0 (Authentication)

**What it does:** Handles user login/signup, JWT tokens, OAuth flows.

### Steps:

1. Go to https://auth0.com and sign up / log in
2. Create a new **Tenant** (e.g., `kobklein` or `kobklein-dev`)

### Create API:

3. Go to **Applications > APIs > Create API**
   - **Name:** KobKlein API
   - **Identifier:** `https://api.kobklein.com` (this is your `AUTH0_AUDIENCE`)
   - **Signing Algorithm:** RS256
4. Note your **Domain** (e.g., `kobklein.us.auth0.com`) → this is `AUTH0_DOMAIN`

### Create Web App (Next.js):

5. Go to **Applications > Applications > Create Application**
   - **Name:** KobKlein Web
   - **Type:** Regular Web Application
6. In Settings:
   - **Allowed Callback URLs:** `http://localhost:3003/api/auth/callback, https://app.kobklein.com/api/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3003, https://app.kobklein.com`
   - **Allowed Web Origins:** `http://localhost:3003, https://app.kobklein.com`
7. Copy **Client ID** and **Client Secret**

### Create Admin App:

8. Create another application:
   - **Name:** KobKlein Admin
   - **Type:** Regular Web Application
   - **Allowed Callback URLs:** `http://localhost:3005/api/auth/callback, https://admin.kobklein.com/api/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3005, https://admin.kobklein.com`

### Create Mobile App:

9. Create another application:
   - **Name:** KobKlein Mobile
   - **Type:** Native Application
   - **Allowed Callback URLs:** `kobklein://callback`
   - **Allowed Logout URLs:** `kobklein://logout`
10. Copy **Client ID** (no secret needed for PKCE)

### Put in .env files:

**API (.env):**
```
AUTH0_DOMAIN=kobklein.us.auth0.com
AUTH0_AUDIENCE=https://api.kobklein.com
AUTH0_ISSUER=https://kobklein.us.auth0.com/
```

**Web App (.env.local):**
```
AUTH0_SECRET=<generate with: openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3003
AUTH0_ISSUER_BASE_URL=https://kobklein.us.auth0.com
AUTH0_CLIENT_ID=<from step 7>
AUTH0_CLIENT_SECRET=<from step 7>
AUTH0_AUDIENCE=https://api.kobklein.com
```

**Admin (.env.local):**
```
AUTH0_SECRET=<generate with: openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3005
AUTH0_ISSUER_BASE_URL=https://kobklein.us.auth0.com
AUTH0_CLIENT_ID=<from step 8>
AUTH0_CLIENT_SECRET=<from step 8>
AUTH0_AUDIENCE=https://api.kobklein.com
```

**Mobile (app.json or .env):**
```
EXPO_PUBLIC_AUTH0_DOMAIN=kobklein.us.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=<from step 10>
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.kobklein.com
```

### Admin Role Setup:

11. Go to **Auth0 > User Management > Roles**
12. Create role: `admin`
13. Go to **Auth Pipeline > Rules** (or Actions > Flows > Login)
14. Add a Post-Login Action that adds roles to the token:
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.kobklein.com';
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```

### For Production:
- Create a SEPARATE Auth0 tenant for production
- Enable **Brute Force Protection** (Security > Attack Protection)
- Enable **Multi-Factor Authentication** for admin users
- Customize the **Universal Login** page with KobKlein branding
- Set **Token Expiration** to 1 hour for access tokens

---

## 3. STRIPE (Payments & Billing)

**What it does:** Processes card payments, manages subscriptions, handles deposits.

### Steps:

1. Go to https://stripe.com and create an account
2. Complete business verification (required for live payments):
   - Business name: KobKlein
   - Business type: Financial Services / Money Transfer
   - Country: (your registered business country)
   - Note: Stripe may require additional documentation for money transfer businesses

### Get API Keys:

3. Go to **Developers > API Keys**
   - Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → `STRIPE_SECRET_KEY`

### Set Up Webhooks:

4. Go to **Developers > Webhooks > Add endpoint**
   - **Endpoint URL:** `https://api.kobklein.com/webhooks/stripe`
   - **Events to listen for:**
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.dispute.created`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
5. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### For Local Development:

6. Install Stripe CLI: https://stripe.com/docs/stripe-cli
```bash
stripe login
stripe listen --forward-to localhost:3002/webhooks/stripe
```
This gives you a local webhook secret (whsec_...) for development.

### Create Products (Subscription Plans):

7. Go to **Products > Add Product**
   - Create 3 plans matching KobKlein tiers:
   - **KobKlein Basic** — Free ($0/mo)
   - **KobKlein Plus** — $4.99/mo
   - **KobKlein Premium** — $9.99/mo
8. Note each Price ID (price_xxx) — these map to your billing plans in the database

### Put in .env:

```
STRIPE_SECRET_KEY=sk_test_xxx  (or sk_live_xxx for production)
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  (or pk_live_xxx for production)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### For Production:
- Switch from test keys to LIVE keys
- Verify webhook endpoint is reachable
- Enable **3D Secure** for card payments
- Set up **Radar** rules for fraud prevention
- Configure **dispute handling** procedures

---

## 4. TWILIO (SMS Notifications)

**What it does:** Sends SMS notifications (transfer alerts, OTPs, withdrawal codes).

### Steps:

1. Go to https://www.twilio.com and sign up
2. Complete identity verification
3. From the Console dashboard, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`

### Get a Phone Number:

4. Go to **Phone Numbers > Manage > Buy a Number**
   - For Haiti: Buy a US number (international SMS to +509 numbers)
   - Enable **SMS** capability
   - Copy the number → `TWILIO_PHONE` (format: +1XXXXXXXXXX)

### For Haiti (+509) Numbers:

5. Important: Twilio can send to Haiti (+509) from US numbers
6. Register your number for A2P (Application-to-Person) messaging:
   - Go to **Messaging > Services > Create**
   - Name: "KobKlein Notifications"
   - Add your phone number to the service
   - Register for **US A2P 10DLC** if using US number

### Put in .env:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+1XXXXXXXXXX
```

### For Production:
- Upgrade from trial ($15 credit) to paid account
- Register for **A2P messaging** (required by carriers)
- Set up **Twilio Verify** for OTP if needed
- Monitor delivery rates in Twilio console
- Budget: ~$0.0075/SMS to US, ~$0.06/SMS to Haiti

---

## 5. RESEND (Email Notifications)

**What it does:** Sends transactional emails (receipts, security alerts, marketing).

### Steps:

1. Go to https://resend.com and sign up
2. Go to **API Keys > Create API Key**
   - Name: "KobKlein Production"
   - Permission: "Full Access" (or "Sending Access" only)
   - Copy the key → `RESEND_API_KEY`

### Set Up Domain:

3. Go to **Domains > Add Domain**
   - Enter: `kobklein.com`
   - Resend gives you DNS records to add:
     - **SPF record** (TXT)
     - **DKIM records** (TXT, usually 3 records)
     - **DMARC record** (TXT)
4. Add these DNS records in your domain registrar
5. Click "Verify" in Resend (may take a few minutes)

### Put in .env:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM=KobKlein <noreply@kobklein.com>
```

### For Production:
- Free tier: 3,000 emails/month (enough for early stage)
- Pro: $20/mo for 50,000 emails
- Monitor bounce/complaint rates
- Set up email templates for professional appearance

---

## 6. UPSTASH REDIS (Queue & Cache)

**What it does:** Powers BullMQ notification queue, caches FX rates, session storage.

### Steps:

1. Go to https://upstash.com and sign up
2. Go to **Redis > Create Database**
   - **Name:** kobklein-production
   - **Region:** US East 1 (closest to your server)
   - **Type:** Regional (cheaper) or Global (faster for multi-region)
   - **TLS:** Enabled (required for production)
3. Copy the **Redis URL** → `REDIS_URL`
   - Format: `rediss://default:PASSWORD@ENDPOINT:PORT`
   - Note the `rediss://` (double s) means TLS-encrypted

### Put in .env:

```
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
```

### For Local Development:

Option A: Use Docker (recommended):
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
# Then use: REDIS_URL=redis://localhost:6379
```

Option B: Use Upstash free tier (200 commands/day)

### For Production:
- Free tier: 10K commands/day (tight for production)
- Pay As You Go: $0.2 per 100K commands
- Pro: $40/mo for 100M commands
- Enable **persistence** for queue durability
- Set **maxmemory-policy** to `allkeys-lru`

---

## 7. SENTRY (Error Monitoring)

**What it does:** Captures and reports errors from API, web, admin, and mobile apps.

### Steps:

1. Go to https://sentry.io and sign up
2. Create a new **Organization** (or use existing)
3. Create **Project** for each app:
   - **kobklein-api** (Platform: Node.js)
   - **kobklein-web** (Platform: Next.js)
   - **kobklein-admin** (Platform: Next.js)
   - **kobklein-mobile** (Platform: React Native)

### Get DSN:

4. For each project, go to **Settings > Client Keys (DSN)**
5. Copy the DSN → `SENTRY_DSN`
   - Format: `https://xxxx@oxxxx.ingest.sentry.io/xxxx`

### Put in .env:

**API:**
```
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Web/Admin (.env.local):**
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### For Production:
- Free tier: 5K errors/month
- Team: $26/mo for 50K errors
- Set up **Alerts** for critical errors (email/Slack notifications)
- Configure **Release Tracking** for deploy correlation
- Set sample rate to 0.2 (20%) in production to save quota

---

## 8. EXPO EAS (Mobile Builds)

**What it does:** Builds and distributes the mobile app (iOS/Android).

### Steps:

1. Go to https://expo.dev and sign up
2. Install EAS CLI:
```bash
npm install -g eas-cli
eas login
```

3. Initialize project (from apps/mobile):
```bash
cd apps/mobile
eas init
```

### Configure Builds:

4. Create `apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://192.168.X.X:3002"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api-staging.kobklein.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.kobklein.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands:

```bash
# Development build (for testing)
eas build --profile development --platform all

# Preview build (for internal testers)
eas build --profile preview --platform all

# Production build (for app stores)
eas build --profile production --platform all

# Submit to App Store / Play Store
eas submit --platform ios
eas submit --platform android
```

### Apple Developer Account (for iOS):

5. Sign up at https://developer.apple.com ($99/year)
6. Create an **App ID** with bundle: `com.kobklein.app`
7. Enable Push Notifications capability
8. Create **APNs Key** (for push notifications):
   - Go to Keys > Create Key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file (save securely)

### Google Play Console (for Android):

9. Sign up at https://play.google.com/console ($25 one-time)
10. Create app: "KobKlein" with package: `com.kobklein.app`
11. Complete the app content questionnaire
12. For push notifications: Firebase is auto-configured by Expo

### For Production:
- Free tier: 30 builds/month (enough for most teams)
- Configure **Update channels** for OTA updates
- Set up **EAS Update** for instant JS-only updates without app store review

---

## 9. DOMAIN & DNS

### Domain Registration:

1. Register `kobklein.com` (if not already owned)
2. Recommended registrars: Namecheap, Cloudflare, Google Domains

### DNS Records to Add:

```
# Main website
A     kobklein.com          → [web-public server IP]
CNAME www.kobklein.com      → kobklein.com

# Web app
CNAME app.kobklein.com      → [web app hosting]

# Admin dashboard
CNAME admin.kobklein.com    → [admin hosting]

# API
A     api.kobklein.com      → [API server IP]

# Email (for Resend)
TXT   kobklein.com          → v=spf1 include:amazonses.com ~all
TXT   resend._domainkey     → [DKIM from Resend]
TXT   _dmarc.kobklein.com   → v=DMARC1; p=quarantine;
```

### SSL Certificates:
- Most platforms (Vercel, Fly.io, Render) auto-provision SSL
- If self-hosting: Use Let's Encrypt with Certbot

---

## 10. DEPLOYMENT PLATFORM

### Recommended Setup:

| Component | Platform | Why |
|-----------|----------|-----|
| API (NestJS) | **Fly.io** or **Render** | Affordable, auto-scaling, Docker support |
| Web App | **Vercel** | Built for Next.js, edge CDN, auto-deploy |
| Admin | **Vercel** | Same benefits, separate project |
| Web-Public | **Vercel** | Same, with ISR for marketing pages |
| Mobile | **Expo EAS** | Native builds without local Xcode/Android Studio |

### Fly.io Setup (for API):

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh
fly auth login

# Deploy from apps/api
cd apps/api
fly launch --name kobklein-api
fly secrets set DATABASE_URL="..." AUTH0_DOMAIN="..." # ... all env vars
fly deploy
```

### Vercel Setup (for Next.js apps):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy web-public
cd apps/web-public
vercel --prod

# Deploy web app
cd apps/web
vercel --prod

# Deploy admin
cd apps/admin
vercel --prod
```

Set environment variables in Vercel Dashboard > Project > Settings > Environment Variables.

---

## QUICK START CHECKLIST

For **development**, you only need:

- [ ] Supabase (free tier) — Database
- [ ] Auth0 (free tier) — Authentication
- [ ] Local Redis via Docker — Queue

Everything else can use stubs/dev mode:
- Twilio: Logs to console if no credentials
- Resend: Logs to console if no credentials
- Stripe: Use test mode keys
- Sentry: Optional for dev
- Expo: Use Expo Go app for dev

For **production**, you need all 10 services configured.

---

## ENVIRONMENT VARIABLE SUMMARY

### API (.env)
```
PORT=3002
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=<openssl rand -hex 32>
AUTH0_DOMAIN=kobklein.us.auth0.com
AUTH0_AUDIENCE=https://api.kobklein.com
AUTH0_ISSUER=https://kobklein.us.auth0.com/
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...
RESEND_API_KEY=re_...
RESEND_FROM=KobKlein <noreply@kobklein.com>
SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=development
```

### Web App (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3003
AUTH0_ISSUER_BASE_URL=https://kobklein.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_AUDIENCE=https://api.kobklein.com
```

### Admin (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3005
AUTH0_ISSUER_BASE_URL=https://kobklein.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_AUDIENCE=https://api.kobklein.com
```

### Mobile (.env or app.config)
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3002
EXPO_PUBLIC_AUTH0_DOMAIN=kobklein.us.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=...
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.kobklein.com
```

---

## COST ESTIMATE (Monthly)

### Development: $0/mo
All services have free tiers sufficient for development.

### Early Production (< 1,000 users): ~$75/mo
| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25 |
| Auth0 | Free (7K users) | $0 |
| Stripe | Pay-as-you-go | ~$5 |
| Twilio | Pay-as-you-go | ~$10 |
| Resend | Free (3K/mo) | $0 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| Sentry | Free (5K errors) | $0 |
| Fly.io (API) | Shared CPU | ~$10 |
| Vercel (3 apps) | Free | $0 |
| Expo EAS | Free | $0 |
| Domain | Annual | ~$1 |
| **Total** | | **~$56/mo** |

### Growth (1,000-10,000 users): ~$250-500/mo
Upgrade Supabase, Auth0, Fly.io, and add monitoring.

---

*Last updated: February 2026*
*KobKlein — Financial Infrastructure for Haiti*
