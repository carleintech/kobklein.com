import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import {
  getNotificationLogs,
  getNotificationStats,
  getNotificationById,
  resetNotificationForRetry,
} from "../notifications/notification-log.service";
import { enqueueNotification, NotificationJob, getNotificationQueue } from "../notifications/notification.queue";

@Controller("admin/notifications")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class NotificationsAdminController {
  /**
   * GET /admin/notifications/stats
   * Aggregate counts: total, sent, failed, queued, today
   */
  @Get("stats")
  async stats() {
    return getNotificationStats();
  }

  /**
   * GET /admin/notifications/logs?status=all&limit=50&offset=0
   * Paginated notification log list
   */
  @Get("logs")
  async logs(
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return getNotificationLogs({
      status: status || "all",
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });
  }

  /**
   * GET /admin/notifications/:id
   * Single notification detail
   */
  @Get(":id")
  async detail(@Param("id") id: string) {
    const log = await getNotificationById(id);
    if (!log) return { error: "Not found" };
    return log;
  }

  /**
   * POST /admin/notifications/:id/retry
   * Re-queue a failed notification
   */
  @Post(":id/retry")
  async retry(@Param("id") id: string) {
    const log = await getNotificationById(id);
    if (!log) return { error: "Not found" };
    if (log.status !== "failed") return { error: "Only failed notifications can be retried" };

    // Reset log status
    const reset = await resetNotificationForRetry(id);
    if (!reset) return { error: "Failed to reset notification" };

    // Re-enqueue the job
    const job: NotificationJob = {
      channel: log.channel,
      to: log.to,
      body: log.body,
      type: log.type,
      data: {},
      attempt: log.attempts + 1,
      logId: id,
    };
    // Re-queue directly using the shared BullMQ queue (reuses existing Redis connection)
    const q = getNotificationQueue();
    if (!q) {
      return { ok: false, message: "Queue unavailable — REDIS_URL not configured" };
    }
    await q.add(log.type, { ...job, logId: id }, {
      priority: log.channel === "sms" ? 1 : 5,
    });

    return { ok: true, message: "Notification re-queued for delivery" };
  }
}
