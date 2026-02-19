import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { AuditService } from "../audit/audit.service";
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from "./subscription.service";

@Controller("v1/subscriptions")
export class SubscriptionControlsController {
  constructor(private auditService: AuditService) {}

  /**
   * Pause a subscription — stops future billing until resumed.
   */
  @UseGuards(SupabaseGuard)
  @Post(":id/pause")
  async pause(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const result = await pauseSubscription(id, userId);

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "subscription_paused",
      referenceId: id,
    });

    return result;
  }

  /**
   * Resume a paused subscription.
   */
  @UseGuards(SupabaseGuard)
  @Post(":id/resume")
  async resume(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const result = await resumeSubscription(id, userId);

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "subscription_resumed",
      referenceId: id,
    });

    return result;
  }

  /**
   * Cancel a subscription permanently.
   */
  @UseGuards(SupabaseGuard)
  @Post(":id/cancel")
  async cancel(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const result = await cancelSubscription(id, userId);

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "subscription_canceled",
      referenceId: id,
    });

    return result;
  }
}
