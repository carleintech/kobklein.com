import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";

@Controller("security")
export class UnlockRequestController {
  @UseGuards(Auth0Guard)
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