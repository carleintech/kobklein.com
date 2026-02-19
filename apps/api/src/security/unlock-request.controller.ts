import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("security")
export class UnlockRequestController {
  @UseGuards(SupabaseGuard)
  @Post("request-unlock")
  async request(@Req() req: any, @Body() body: { reason?: string }) {
    const userId = req.user.sub;

    const existing = await prisma.unlockRequest.findFirst({
      where: { userId, status: "pending" },
    });

    if (existing) return { ok: true, pending: true };

    await prisma.unlockRequest.create({
      data: {
        userId,
        reason: body.reason || "User requested unlock",
      },
    });

    return { ok: true };
  }
}