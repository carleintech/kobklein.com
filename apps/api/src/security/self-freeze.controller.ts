import { Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { createNotification } from "../notifications/notification.service";

@Controller("security")
export class SelfFreezeController {
  @UseGuards(Auth0Guard)
  @Post("freeze")
  async freeze(@Req() req: any) {
    const userId = req.user.sub;

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
      "Your account has been locked. Contact support to restore access."
    );

    return { ok: true };
  }
}