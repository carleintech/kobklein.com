# Stripe Setup Guide — KobKlein

## 1. Create Your Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Verify your email and complete business onboarding
3. For development, keep **Test Mode** toggled on (top-left toggle in dashboard)

---

## 2. Get Your API Keys

**Dashboard → Developers → API keys**

| Key | Use |
|-----|-----|
| `Publishable key` (pk_test_…) | Frontend only (not needed for this API) |
| `Secret key` (sk_test_…) | Backend — copy this |

Add to `apps/api/.env`:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

For production use `sk_live_…` keys.

---

## 3. Create Products and Prices (Subscription Plans)

**Dashboard → Product catalog → Add product**

Create three products matching KobKlein's plan tiers:

| Product Name | Description | Price | Interval |
|---|---|---|---|
| KobKlein Basic | Basic plan | $9.99 | Monthly |
| KobKlein Pro | Pro plan | $24.99 | Monthly |
| KobKlein Enterprise | Enterprise plan | $79.99 | Monthly |

After creating each price, copy the **Price ID** (starts with `price_`).

Add to `apps/api/.env`:
```
STRIPE_PRICE_BASIC=price_XXXXX
STRIPE_PRICE_PRO=price_XXXXX
STRIPE_PRICE_ENTERPRISE=price_XXXXX
```

---

## 4. Configure the Webhook

**Dashboard → Developers → Webhooks → Add endpoint**

- **Endpoint URL**: `https://your-api-domain.com/webhooks/stripe`
- **Events to listen to**:
  - `payment_intent.succeeded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `charge.dispute.created`

After saving, click **Reveal signing secret** and copy the `whsec_…` value.

Add to `apps/api/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### Local Testing (Stripe CLI)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

This gives you a local webhook secret — use it for development.

---

## 5. Customer Portal (for plan management)

**Dashboard → Settings → Billing → Customer portal → Activate**

Enable:
- Cancel subscriptions
- Switch plans
- Update payment methods

The `GET /v1/billing/portal` endpoint uses this to redirect users to Stripe's hosted portal.

---

## 6. Environment Variables Summary

Add all of these to `apps/api/.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

---

## 7. Test Mode Cards

Use these card numbers for testing (any future expiry, any CVV):

| Scenario | Card Number |
|---|---|
| Success | `4242 4242 4242 4242` |
| Requires 3D Secure | `4000 0025 0000 3155` |
| Declined | `4000 0000 0000 9995` |
| Insufficient funds | `4000 0000 0000 9995` |

---

## 8. Going Live

1. Toggle to **Live Mode** in the Stripe dashboard
2. Replace `sk_test_…` with `sk_live_…`
3. Replace `whsec_…` with your live webhook secret
4. Create live products/prices and update the price IDs
5. Complete Stripe's business verification if not done
