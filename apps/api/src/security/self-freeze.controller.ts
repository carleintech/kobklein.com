import { Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { createNotification } from "../notifications/notification.service";

@Controller("security")
export class SelfFreezeController {
  @UseGuards(SupabaseGuard)
  @Post("freeze")
  async freeze(@Req() req: any) {
    // req.localUser.id is the DB primary key; req.user.sub is Supabase auth UUID
    const userId = req.localUser?.id || req.user?.sub;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: true,
        freezeReason: "User initiated lock",
        frozenAt: new Date(),
      },
    });

    await createNotification(
      userId,
      "Account Locked",
      "Your account has been locked. You can unlock it anytime from the Security settings."
    );

    return { ok: true };
  }

  /**
   * Self-unlock — lets the user unlock their own account without contacting support.
   * Only works for accounts frozen via the emergency lock (freezeReason = "User initiated lock").
   * Admin-frozen accounts (e.g. fraud hold) cannot be self-unlocked.
   */
  @UseGuards(SupabaseGuard)
  @Post("unfreeze")
  async unfreeze(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isFrozen: true, freezeReason: true },
    });

    if (!user?.isFrozen) {
      return { ok: true, message: "Account is not locked" };
    }

    // Only allow self-unlock if frozen by the user themselves
    const selfLocked = user.freezeReason === "User initiated lock";
    if (!selfLocked) {
      return {
        ok: false,
        adminLocked: true,
        message: "Your account was locked by our security team. Please contact support to restore access.",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: false,
        freezeReason: null,
        frozenAt: null,
      },
    });

    await createNotification(
      userId,
      "Account Unlocked",
      "Your account has been unlocked successfully. All features are now restored."
    );

    return { ok: true, message: "Account unlocked successfully" };
  }
}
