import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";

@Controller("notifications")
export class NotificationCountController {
  @UseGuards(Auth0Guard)
  @Get("count")
  async count(@Req() req: any) {
    const c = await prisma.notification.count({
      where: {
        userId: req.user.sub,
        read: false,
      },
    });

    return { unread: c };
  }
}