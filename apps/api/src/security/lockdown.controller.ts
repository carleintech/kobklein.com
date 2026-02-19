import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { revokeAllDevices } from "./device.service";
import { createNotification } from "../notifications/notification.service";
import { renderTemplate, toLang } from "../i18n/render";

@Controller("security")
export class LockdownController {
  /**
   * POST /security/lockdown — User-initiated emergency account lockdown.
   *
   * - Freezes the account
   * - Revokes all device sessions
   * - Invalidates all active StepUpTokens
   * - Sends security notification
   */
  @UseGuards(SupabaseGuard)
  @Post("lockdown")
  async lockdown(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    // 1. Freeze account
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: true,
        freezeReason: "User-initiated security lockdown",
        frozenAt: new Date(),
      },
    });

    // 2. Revoke all device sessions
    await revokeAllDevices(userId);

    // 3. Invalidate all unused StepUpTokens
    await prisma.stepUpToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    // 4. Notify user
    const lang = toLang(user.preferredLang);
    const msg = renderTemplate("security_lockdown", lang, {});
    await createNotification(userId, msg.title, msg.body, "security");

    return {
      ok: true,
      message: "Account locked. All sessions revoked. Contact support to unlock.",
    };
  }
}
