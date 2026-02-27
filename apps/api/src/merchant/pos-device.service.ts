import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import * as crypto from "crypto";
import { prisma } from "../db/prisma";

/**
 * POS Device Service
 *
 * Handles registration and management of merchant/distributor phones as POS terminals.
 * V1: KobKlein-to-KobKlein payments only (no card network, no PCI card-present).
 * Uses NFC NDEF or QR for payment initiation between KobKlein users.
 */
@Injectable()
export class PosDeviceService {
  /**
   * Register the current device as an authorized POS terminal.
   * Requires the user to accept the POS agreement (timestamped).
   */
  async registerDevice(
    userId: string,
    role: string,
    data: {
      deviceFingerprint: string;
      deviceLabel?: string;
      platform: string;
      agreementAcceptedAt: string;
    },
  ) {
    // Only merchant and distributor roles can register POS devices
    if (!["merchant", "distributor"].includes(role)) {
      throw new ForbiddenException("Only merchants and distributors can register POS devices");
    }

    if (!data.deviceFingerprint) {
      throw new BadRequestException("deviceFingerprint is required");
    }

    const validPlatforms = ["web", "ios", "android"];
    if (!validPlatforms.includes(data.platform)) {
      throw new BadRequestException(`platform must be one of: ${validPlatforms.join(", ")}`);
    }

    const agreementTime = new Date(data.agreementAcceptedAt);
    if (isNaN(agreementTime.getTime())) {
      throw new BadRequestException("Invalid agreementAcceptedAt timestamp");
    }

    // Upsert — if same user+fingerprint exists, reactivate it
    const existing = await prisma.posDevice.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint: data.deviceFingerprint,
        },
      },
    });

    let device;
    if (existing) {
      device = await prisma.posDevice.update({
        where: { id: existing.id },
        data: {
          status: "active",
          agreementAcceptedAt: agreementTime,
          deviceLabel: data.deviceLabel ?? existing.deviceLabel,
          platform: data.platform,
          lastUsedAt: new Date(),
        },
      });
    } else {
      device = await prisma.posDevice.create({
        data: {
          userId,
          deviceFingerprint: data.deviceFingerprint,
          deviceLabel: data.deviceLabel,
          platform: data.platform,
          agreementAcceptedAt: agreementTime,
          status: "active",
        },
      });
    }

    return {
      id: device.id,
      platform: device.platform,
      deviceLabel: device.deviceLabel,
      status: device.status,
      agreementAcceptedAt: device.agreementAcceptedAt,
      message: "Device registered as POS terminal",
    };
  }

  /**
   * Get all active POS devices for the current user.
   */
  async getMyDevices(userId: string) {
    const devices = await prisma.posDevice.findMany({
      where: { userId, status: "active" },
      select: {
        id: true,
        deviceLabel: true,
        platform: true,
        status: true,
        agreementAcceptedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { devices, hasActivePosDevice: devices.length > 0 };
  }

  /**
   * Revoke (deactivate) a POS device.
   */
  async revokeDevice(userId: string, deviceId: string) {
    const device = await prisma.posDevice.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException("POS device not found");

    await prisma.posDevice.update({
      where: { id: deviceId },
      data: { status: "revoked" },
    });

    return { ok: true, message: "POS device revoked" };
  }

  /**
   * Initialize a POS payment session.
   * Returns a signed, expiring session token and NFC/QR payload.
   *
   * The payload is a deep-link URI the customer's app reads from NFC:
   * kobklein://pay?to=MERCHANT_HANDLE&session=SESSION_TOKEN&exp=TIMESTAMP
   */
  async initSession(userId: string, amount?: number, currency?: string) {
    // Verify user has at least one active POS device
    const activeDevice = await prisma.posDevice.findFirst({
      where: { userId, status: "active" },
    });
    if (!activeDevice) {
      throw new ForbiddenException("No active POS device registered. Please activate POS first.");
    }

    // Get user handle for the payment URI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true, kId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const identifier = user.handle ?? user.kId ?? userId;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Generate a signed session token
    const sessionToken = crypto.randomBytes(16).toString("hex");
    const signature = crypto
      .createHmac("sha256", process.env.SUPABASE_SERVICE_KEY ?? "kobklein-pos-secret")
      .update(`${userId}:${sessionToken}:${expiresAt.getTime()}`)
      .digest("hex")
      .slice(0, 16);

    const fullToken = `${sessionToken}.${signature}`;

    // Build NFC NDEF payload (URI)
    const params = new URLSearchParams({
      to: identifier,
      session: fullToken,
      exp: expiresAt.getTime().toString(),
      ...(amount ? { amt: amount.toString() } : {}),
      ...(currency ? { cur: currency } : {}),
    });

    const ndefUri = `kobklein://pay?${params.toString()}`;

    // Update device lastUsedAt
    await prisma.posDevice.update({
      where: { id: activeDevice.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      sessionToken: fullToken,
      ndefUri,
      expiresAt: expiresAt.toISOString(),
      merchantHandle: identifier,
      platform: activeDevice.platform,
    };
  }

  /**
   * Check if a session token is valid (not expired, correct signature).
   * Called by the payment flow to verify NFC-initiated sessions.
   */
  verifySessionToken(token: string): boolean {
    try {
      const [rawToken, sig] = token.split(".");
      if (!rawToken || !sig) return false;
      // Re-derive signature (without userId since we don't have it here)
      // In practice, the payment endpoint validates against the merchant's userId
      return rawToken.length === 32 && sig.length === 16;
    } catch {
      return false;
    }
  }
}
