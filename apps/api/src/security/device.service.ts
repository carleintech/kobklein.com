import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";
import { renderTemplate, toLang } from "../i18n/render";

// ─── Helpers ────────────────────────────────────────────────────

async function getUserLang(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLang: true },
  });
  return toLang(user?.preferredLang);
}

// ─── Core: Register Device on Auth ──────────────────────────────

export async function registerDeviceSession(userId: string, req: any) {
  const fingerprint = req.headers["x-device-id"] || req.headers["user-agent"];
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  const existing = await prisma.deviceSession.findFirst({
    where: { userId, fingerprint, ip, revokedAt: null },
  });

  if (!existing) {
    await prisma.deviceSession.create({
      data: { userId, fingerprint, ip, userAgent },
    });

    // Skip notification for loopback/localhost IPs (dev environment)
    const isLocalhost = !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.");
    if (!isLocalhost) {
      const lang = await getUserLang(userId);
      const msg = renderTemplate("security_new_device", lang, { ip: ip || "unknown" });
      await createNotification(userId, msg.title, msg.body, "security");
    }

    return { isNew: true };
  }

  await prisma.deviceSession.update({
    where: { id: existing.id },
    data: { lastSeenAt: new Date() },
  });

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
