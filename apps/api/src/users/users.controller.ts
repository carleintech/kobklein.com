import { Controller, Get, Patch, Post, Delete, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import * as crypto from "crypto";
import * as QRCode from "qrcode";

async function ensureKId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { kId: true } });
  if (user?.kId) return user.kId;
  // Auto-generate if missing (covers users who registered before this feature)
  for (let i = 0; i < 5; i++) {
    const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const kId = `KK-${p1}-${p2}`;
    const conflict = await prisma.user.findUnique({ where: { kId } });
    if (!conflict) {
      await prisma.user.update({ where: { id: userId }, data: { kId } });
      return kId;
    }
  }
  const kId = `KK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await prisma.user.update({ where: { id: userId }, data: { kId } });
  return kId;
}

@Controller("v1/users")
export class UsersController {
  /**
   * GET /v1/users/me
   * Returns the authenticated user's profile from the local database.
   */
  @UseGuards(SupabaseGuard)
  @Get("me")
  me(@Req() req: any) {
    const u = req.localUser;

    if (!u) {
      return {
        id: req.user?.sub ?? null,
        role: req.user?.user_metadata?.role ?? "user",
        firstName: null,
        lastName: null,
        email: req.user?.email ?? null,
        handle: null,
        kId: null,
        kycTier: 0,
        kycStatus: "none",
        phone: null,
        isFrozen: false,
        preferredLang: "en",
        profilePhotoUrl: null,
        onboardingComplete: false,
        createdAt: null,
      };
    }

    return {
      id: u.id,
      role: u.role,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: u.email ?? null,
      handle: u.handle ?? null,
      kId: u.kId ?? null,
      kycTier: u.kycTier ?? 0,
      kycStatus: u.kycStatus ?? "none",
      phone: u.phone ?? null,
      isFrozen: u.isFrozen ?? false,
      preferredLang: u.preferredLang ?? "en",
      profilePhotoUrl: u.profilePhotoUrl ?? null,
      onboardingComplete: u.onboardingComplete ?? false,
      createdAt: u.createdAt ?? null,
    };
  }

  /**
   * PATCH /v1/users/profile
   * Update editable profile fields: firstName, lastName, profilePhotoUrl
   */
  @UseGuards(SupabaseGuard)
  @Patch("profile")
  async updateProfile(
    @Req() req: any,
    @Body() body: { firstName?: string; lastName?: string; profilePhotoUrl?: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const data: Record<string, any> = {};
    if (body.firstName !== undefined) data.firstName = body.firstName.trim() || null;
    if (body.lastName  !== undefined) data.lastName  = body.lastName.trim() || null;
    if (body.profilePhotoUrl !== undefined) data.profilePhotoUrl = body.profilePhotoUrl;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        handle: true, phone: true, profilePhotoUrl: true,
      },
    });

    return { ok: true, ...updated };
  }

  /**
   * DELETE /v1/users/me
   * Permanently delete the user's account and all associated data.
   * Soft-delete approach: marks account deleted and anonymizes PII.
   */
  @UseGuards(SupabaseGuard)
  @Delete("me")
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    // Anonymize PII and mark account as deleted
    const deletedEmail = `deleted_${userId}@kobklein.deleted`;
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: deletedEmail,
        firstName: "Deleted",
        lastName: "User",
        phone: null,
        handle: null,
        profilePhotoUrl: null,
        isFrozen: true,
        freezeReason: "Account deleted by user",
        frozenAt: new Date(),
      },
    });

    return { ok: true, message: "Account deleted successfully" };
  }

  /**
   * GET /v1/users/me/kid
   * Returns the user's K-ID, auto-generating it if not yet assigned.
   * Also returns a QR code data URL for sharing.
   */
  @UseGuards(SupabaseGuard)
  @Get("me/kid")
  async getKId(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    const kId = await ensureKId(userId);

    // QR payload: deep link that opens KobKlein and pays this user
    const qrPayload = `kobklein://pay?kid=${kId}`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: "#0D9E8A", light: "#FFFFFF" },
    });

    const user = req.localUser;
    return {
      kId,
      qrPayload,
      qrDataUrl,
      displayName: user
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.handle || "KobKlein User"
        : "KobKlein User",
      handle: user?.handle ?? null,
    };
  }
}
