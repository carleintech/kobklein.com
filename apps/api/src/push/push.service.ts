/**
 * Push Notification Service — KobKlein API
 *
 * Supports two push channels:
 *   1. Expo SDK (mobile: iOS/Android) — existing
 *   2. VAPID Web Push (PWA) — new
 *
 * Required env vars for web push:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 * Generate with: npx web-push generate-vapid-keys
 */
import * as webpush from "web-push";
import { prisma } from "../db/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── VAPID Init ──────────────────────────────────────────────────────

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_EMAIL
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// ─── Token Management ────────────────────────────────────────────────

export async function registerToken(
  userId: string,
  token: string,
  platform: string,
): Promise<{ id: string }> {
  // Upsert — if token exists, update owner + reactivate
  const existing = await prisma.pushToken.findUnique({ where: { token } });

  if (existing) {
    const updated = await prisma.pushToken.update({
      where: { token },
      data: { userId, platform, active: true },
    });
    return { id: updated.id };
  }

  const created = await prisma.pushToken.create({
    data: { userId, token, platform },
  });
  return { id: created.id };
}

export async function deactivateToken(token: string): Promise<void> {
  await prisma.pushToken.updateMany({
    where: { token },
    data: { active: false },
  });
}

export async function tokensForUser(userId: string): Promise<string[]> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, active: true },
    select: { token: true },
  });
  return tokens.map((t) => t.token);
}

// ─── Send Notifications ──────────────────────────────────────────────

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send push notification to a specific user (all active devices).
 * Automatically deactivates tokens that Expo reports as invalid.
 */
export async function notifyUser(
  userId: string,
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  const tokens = await tokensForUser(userId);
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const messages = tokens.map((token) => ({
    to: token,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    sound: message.sound ?? "default",
    badge: message.badge,
    channelId: message.channelId ?? "default",
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    let failed = 0;

    // Handle ticket errors — deactivate invalid tokens
    if (result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "error") {
          failed++;
          if (
            ticket.details?.error === "DeviceNotRegistered" ||
            ticket.details?.error === "InvalidCredentials"
          ) {
            await deactivateToken(tokens[i]);
          }
        }
      }
    }

    return { sent: tokens.length - failed, failed };
  } catch (err) {
    console.error("Expo push send failed:", err);
    return { sent: 0, failed: tokens.length };
  }
}

/**
 * Send push notification to multiple users.
 */
export async function notifyUsers(
  userIds: string[],
  message: PushMessage,
): Promise<void> {
  await Promise.allSettled(
    userIds.map((userId) => notifyUser(userId, message)),
  );
}

// ─── VAPID Web Push ──────────────────────────────────────────────────

export interface WebPushSubscription {
  endpoint: string;
  keys: { auth: string; p256dh: string };
}

/**
 * Register a web push subscription (PWA).
 * Stores the full subscription JSON as the token field.
 */
export async function registerWebSubscription(
  userId: string,
  subscription: WebPushSubscription,
): Promise<{ id: string }> {
  const token = subscription.endpoint; // endpoint is unique per browser/device
  const tokenData = JSON.stringify(subscription);

  const existing = await prisma.pushToken.findUnique({ where: { token } });

  if (existing) {
    const updated = await prisma.pushToken.update({
      where: { token },
      // Store full subscription in a custom field via the token value
      data: { userId, platform: "web", active: true, token: tokenData },
    });
    return { id: updated.id };
  }

  const created = await prisma.pushToken.create({
    data: { userId, token: tokenData, platform: "web" },
  });
  return { id: created.id };
}

/**
 * Send VAPID web push notification to all web subscriptions for a user.
 * Deactivates expired/invalid subscriptions automatically.
 */
export async function notifyUserWebPush(
  userId: string,
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_EMAIL
  ) {
    return { sent: 0, failed: 0 }; // VAPID not configured
  }

  const tokens = await prisma.pushToken.findMany({
    where: { userId, platform: "web", active: true },
    select: { token: true },
  });

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const { token } of tokens) {
    try {
      let subscription: webpush.PushSubscription;
      try {
        subscription = JSON.parse(token) as webpush.PushSubscription;
      } catch {
        await prisma.pushToken.updateMany({ where: { token }, data: { active: false } });
        failed++;
        continue;
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: message.title,
          body: message.body,
          data: message.data ?? {},
          url: (message.data?.url as string) ?? "/notifications",
        }),
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      // 410 Gone or 404 = subscription expired; deactivate it
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        ((err as { statusCode: number }).statusCode === 410 ||
          (err as { statusCode: number }).statusCode === 404)
      ) {
        await prisma.pushToken.updateMany({ where: { token }, data: { active: false } });
      }
    }
  }

  return { sent, failed };
}
