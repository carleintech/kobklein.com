import { Controller, Post, Param, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("admin/unlock")
export class UnlockReviewController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/approve")
  async approve(@Param("id") id: string) {
    const req = await prisma.unlockRequest.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        isFrozen: false,
        freezeReason: null,
      },
    });

    return { ok: true };
  }
}