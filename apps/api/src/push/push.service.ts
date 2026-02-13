/**
 * Push Notification Service — KobKlein API
 *
 * Registers Expo push tokens, deactivates stale tokens,
 * and sends notifications via Expo Push API.
 */
import { prisma } from "../db/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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
