/**
 * Plan Billing Service — Stripe Subscription Management
 *
 * Handles creating, upgrading, canceling Stripe subscriptions for
 * platform plans (Diaspora Plus, Merchant Growth, Distributor Pro).
 *
 * This is SEPARATE from the K-Pay subscription system which charges
 * from USD wallet for third-party services (Netflix, Spotify).
 *
 * Flow:
 *   1. User selects plan on frontend
 *   2. POST /v1/billing/checkout → creates Stripe Checkout Session
 *   3. User completes payment on Stripe-hosted page
 *   4. Stripe webhook → creates/updates UserPlan record
 *   5. User features unlocked based on plan tier
 */
import Stripe from "stripe";
import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";
import { renderTemplate, toLang } from "../i18n/render";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

// ─── Checkout Session ──────────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a platform plan subscription.
 *
 * @param userId — KobKlein user ID
 * @param planSlug — e.g. "diaspora_plus", "merchant_growth"
 * @param successUrl — redirect URL on success
 * @param cancelUrl — redirect URL on cancel
 */
export async function createCheckoutSession(
  userId: string,
  planSlug: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  // Look up plan
  const plan = await prisma.platformPlan.findUnique({ where: { slug: planSlug } });
  if (!plan || !plan.active) throw new Error("Plan not found or inactive");
  if (!plan.stripePriceId) throw new Error("Plan has no Stripe price configured");

  // Look up user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
  if (!user) throw new Error("User not found");

  // Check user role matches plan role
  if (plan.role !== user.role) {
    throw new Error(`Plan "${planSlug}" is for ${plan.role} accounts, but you are a ${user.role}`);
  }

  // Check if already subscribed to this plan
  const existing = await prisma.userPlan.findFirst({
    where: { userId, planId: plan.id, status: { in: ["active", "trialing"] } },
  });
  if (existing) throw new Error("You already have an active subscription to this plan");

  // Get or create Stripe Customer
  let stripeCustomerId: string | undefined;
  const existingPlan = await prisma.userPlan.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });

  if (existingPlan?.stripeCustomerId) {
    stripeCustomerId = existingPlan.stripeCustomerId;
  } else if (user.email) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
  }

  // Create Checkout Session
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      planId: plan.id,
      planSlug: plan.slug,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planId: plan.id,
        planSlug: plan.slug,
      },
    },
  };

  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email || undefined;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url || "",
  };
}

// ─── Customer Portal ───────────────────────────────────────────

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const stripe = getStripe();

  const userPlan = await prisma.userPlan.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });

  if (!userPlan?.stripeCustomerId) {
    throw new Error("No active subscription found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: userPlan.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// ─── Webhook Handlers ──────────────────────────────────────────

/**
 * Handle Stripe subscription events from webhook.
 */
export async function handleSubscriptionEvent(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionChange(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_failed":
      await onPaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
}

async function onSubscriptionChange(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const planId = sub.metadata.planId;
  if (!userId || !planId) {
    console.warn("[BILLING] Subscription missing userId/planId metadata:", sub.id);
    return;
  }

  const plan = await prisma.platformPlan.findUnique({ where: { id: planId } });
  if (!plan) return;

  // Map Stripe status to our status
  let status: string;
  switch (sub.status) {
    case "active":
      status = "active";
      break;
    case "trialing":
      status = "trialing";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      status = "canceled";
      break;
    default:
      status = sub.status;
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.toString() || null;

  // Stripe SDK v20 uses camelCase (currentPeriodStart, not current_period_start)
  const subAny = sub as any;
  const periodStart = subAny.currentPeriodStart ?? subAny.current_period_start;
  const periodEnd = subAny.currentPeriodEnd ?? subAny.current_period_end;
  const cancelAt = subAny.canceledAt ?? subAny.canceled_at;
  const trialEndTs = subAny.trialEnd ?? subAny.trial_end;

  await prisma.userPlan.upsert({
    where: { userId_planId: { userId, planId } },
    update: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      canceledAt: cancelAt ? new Date(cancelAt * 1000) : null,
      trialEnd: trialEndTs ? new Date(trialEndTs * 1000) : null,
    },
    create: {
      userId,
      planId,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      canceledAt: cancelAt ? new Date(cancelAt * 1000) : null,
      trialEnd: trialEndTs ? new Date(trialEndTs * 1000) : null,
    },
  });

  // Notify user
  if (status === "active") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });
    const lang = toLang(user?.preferredLang);
    const msg = renderTemplate("plan_activated", lang, { planName: plan.nameEn });
    await createNotification(userId, msg.title, msg.body, "system");
  }
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const planId = sub.metadata.planId;
  if (!userId || !planId) return;

  await prisma.userPlan.updateMany({
    where: { userId, planId },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  });

  // Notify user
  const plan = await prisma.platformPlan.findUnique({ where: { id: planId } });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLang: true },
  });
  const lang = toLang(user?.preferredLang);
  const msg = renderTemplate("plan_canceled", lang, { planName: plan?.nameEn || "Plan" });
  await createNotification(userId, msg.title, msg.body, "system");
}

async function onPaymentFailed(invoice: Stripe.Invoice) {
  // Stripe SDK v20: subscription may be on different properties
  const invoiceAny = invoice as any;
  const sub = invoiceAny.subscription ?? invoiceAny.subscriptionId;
  if (!sub) return;

  const subId = typeof sub === "string" ? sub : sub.toString();
  const userPlan = await prisma.userPlan.findFirst({
    where: { stripeSubscriptionId: subId },
    include: { plan: true },
  });
  if (!userPlan) return;

  await prisma.userPlan.update({
    where: { id: userPlan.id },
    data: { status: "past_due" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userPlan.userId },
    select: { preferredLang: true },
  });
  const lang = toLang(user?.preferredLang);
  const msg = renderTemplate("plan_payment_failed", lang, { planName: userPlan.plan.nameEn });
  await createNotification(userPlan.userId, msg.title, msg.body, "system");
}

// ─── Plan Feature Resolver ─────────────────────────────────────

/**
 * Get the active plan features for a user.
 * Returns null if user is on free tier.
 */
export async function getUserPlanFeatures(
  userId: string,
): Promise<{ plan: any; features: Record<string, any> } | null> {
  const userPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { plan: { tier: "desc" } }, // highest tier first
  });

  if (!userPlan) return null;

  return {
    plan: {
      slug: userPlan.plan.slug,
      tier: userPlan.plan.tier,
      role: userPlan.plan.role,
      name: userPlan.plan.nameEn,
    },
    features: (userPlan.plan.features as Record<string, any>) || {},
  };
}
