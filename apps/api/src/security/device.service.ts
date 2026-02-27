import { prisma } from "../db/prisma";
import { renderTemplate, toLang } from "../i18n/render";
import { createNotification } from "../notifications/notification.service";

// ─── In-memory device cache ──────────────────────────────────────────────────
// Avoids 2 DB round-trips (findFirst + update) for known devices on every request.
// TTL: 5 minutes — a revoked device gets blocked within one TTL window.
type CachedDevice = { id: string; trusted: boolean; expiresAt: number };
const DEVICE_CACHE = new Map<string, CachedDevice>();
const DEVICE_CACHE_TTL_MS = 300_000; // 5 minutes

function deviceKey(userId: string, fingerprint: string, ip: string): string {
  return `${userId}:${fingerprint}:${ip}`;
}

// ─── Helpers ────────────────────────────────────────────────────

async function getUserLang(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLang: true },
  });
  return toLang(user?.preferredLang);
}

// ─── Core: Register Device on Auth ──────────────────────────────

export async function registerDeviceSession(userId: string, req: Record<string, unknown>) {
  const headers = req.headers as Record<string, string>;
  const fingerprint = headers["x-device-id"] || headers["user-agent"] || "unknown";
  const ip = (req.ip as string) || "";
  const userAgent = headers["user-agent"] || "";
  const key = deviceKey(userId, fingerprint, ip);

  // Cache hit — device is already known; update lastSeenAt in the background
  const cached = DEVICE_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    // Fire-and-forget: lastSeenAt update is non-critical, don't block the request
    prisma.deviceSession
      .update({ where: { id: cached.id }, data: { lastSeenAt: new Date() } })
      .catch(() => { /* ignore — non-critical */ });
    return { isNew: false, trusted: cached.trusted };
  }

  // Cache miss — query DB to check if device exists
  const existing = await prisma.deviceSession.findFirst({
    where: { userId, fingerprint, ip, revokedAt: null },
  });

  if (!existing) {
    const created = await prisma.deviceSession.create({
      data: { userId, fingerprint, ip, userAgent },
    });

    // Skip notification for loopback/localhost IPs (dev environment)
    const isLocalhost = !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.");
    if (!isLocalhost) {
      const lang = await getUserLang(userId);
      const msg = renderTemplate("security_new_device", lang, { ip: ip || "unknown" });
      await createNotification(userId, msg.title, msg.body, "security");
    }

    // Cache the new device
    DEVICE_CACHE.set(key, { id: created.id, trusted: false, expiresAt: Date.now() + DEVICE_CACHE_TTL_MS });
    return { isNew: true };
  }

  // Fire-and-forget lastSeenAt update — doesn't block the response
  prisma.deviceSession
    .update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } })
    .catch(() => { /* ignore — non-critical */ });

  // Cache the known device for future requests
  DEVICE_CACHE.set(key, { id: existing.id, trusted: existing.trusted, expiresAt: Date.now() + DEVICE_CACHE_TTL_MS });
  return { isNew: false, trusted: existing.trusted };
}

// ─── Device Management ──────────────────────────────────────────

export async function getUserDevices(userId: string) {
  return prisma.deviceSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function trustDevice(userId: string, deviceId: string) {
  return prisma.deviceSession.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { trusted: true },
  });
}

export async function labelDevice(userId: string, deviceId: string, label: string) {
  return prisma.deviceSession.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { label },
  });
}

export async function revokeDevice(userId: string, deviceId: string) {
  const lang = await getUserLang(userId);
  const msg = renderTemplate("security_device_revoked", lang, {});

  await prisma.deviceSession.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: new Date(), trusted: false },
  });

  await createNotification(userId, msg.title, msg.body, "security");
}

export async function revokeAllDevices(userId: string) {
  await prisma.deviceSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), trusted: false },
  });
}

export async function isDeviceTrusted(userId: string, fingerprint: string, ip: string): Promise<boolean> {
  const device = await prisma.deviceSession.findFirst({
    where: { userId, fingerprint, ip, trusted: true, revokedAt: null },
  });
  return !!device;
}

// ─── Admin ──────────────────────────────────────────────────────

export async function getDevicesForUser(userId: string) {
  return prisma.deviceSession.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function adminRevokeDevice(deviceId: string) {
  return prisma.deviceSession.update({
    where: { id: deviceId },
    data: { revokedAt: new Date(), trusted: false },
  });
}
