import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("notifications")
export class NotificationCountController {
  @UseGuards(SupabaseGuard)
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