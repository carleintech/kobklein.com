import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("v1/notifications")
export class NotificationCountController {
  @UseGuards(SupabaseGuard)
  @Get("count")
  async count(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    const c = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { unread: c };
  }
}