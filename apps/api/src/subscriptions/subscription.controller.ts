import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { createSubscription } from "./subscription.service";

@Controller("v1/subscriptions")
export class SubscriptionController {
  constructor(private auditService: AuditService) {}

  /**
   * Create a new subscription proxy.
   *
   * Body: { merchant: "NETFLIX", amountUsd: 15.99, externalAccountRef?: "user@email.com" }
   */
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      merchant: string;
      amountUsd: number;
      externalAccountRef?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    if (!body.merchant || !body.amountUsd) {
      throw new Error("merchant and amountUsd are required");
    }

    const result = await createSubscription({
      userId,
      merchant: body.merchant,
      amountUsd: body.amountUsd,
      externalAccountRef: body.externalAccountRef,
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "subscription_created",
      amount: body.amountUsd,
      currency: "USD",
      referenceId: result.subscription.id,
      meta: { merchant: body.merchant.toUpperCase() },
    });

    return result;
  }

  /**
   * List all subscriptions for the authenticated user.
   */
  @UseGuards(Auth0Guard)
  @Get()
  async list(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    return prisma.subscriptionProxy.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        merchant: true,
        externalAccountRef: true,
        amountUsd: true,
        currency: true,
        status: true,
        nextBilling: true,
        lastCharged: true,
        failureCount: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get a single subscription by ID.
   */
  @UseGuards(Auth0Guard)
  @Get(":id")
  async getOne(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const sub = await prisma.subscriptionProxy.findUnique({ where: { id } });
    if (!sub) throw new Error("Subscription not found");
    if (sub.userId !== userId) throw new Error("Not your subscription");

    return sub;
  }
}
