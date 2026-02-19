import { Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { renderTemplate, toLang } from "../i18n/render";

@Controller("notifications")
export class NotificationController {
  /**
   * List recent notifications for the authenticated user.
   *
   * If a notification has a templateKey, it renders the title/body
   * in the user's preferred language. Otherwise, returns stored title/body.
   *
   * Query: ?limit=30
   */
  @UseGuards(SupabaseGuard)
  @Get()
  async list(@Req() req: any, @Query("limit") limit?: string) {
    const userId = req.localUser?.id || req.user?.sub;
    const take = Math.min(parseInt(limit || "30", 10), 100);

    // Get user's language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });

    const lang = toLang(user?.preferredLang);

    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });

    // Render templates where available, otherwise use stored title/body
    const rendered = items.map((n) => {
      let title = n.title;
      let body = n.body;

      if (n.templateKey) {
        const tmpl = renderTemplate(
          n.templateKey,
          lang,
          (n.params as Record<string, any>) || {},
        );
        // Only override if template rendered successfully
        if (tmpl.title) title = tmpl.title;
        if (tmpl.body) body = tmpl.body;
      }

      return {
        id: n.id,
        type: n.type,
        title,
        body,
        read: n.read,
        data: n.data,
        createdAt: n.createdAt,
      };
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return { ok: true, unreadCount, items: rendered };
  }

  /**
   * Mark a single notification as read.
   */
  @UseGuards(SupabaseGuard)
  @Post(":id/read")
  async markRead(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) throw new Error("Not found");

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return { ok: true };
  }

  /**
   * Mark all notifications as read.
   */
  @UseGuards(SupabaseGuard)
  @Patch("read-all")
  async readAll(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { ok: true };
  }
}
