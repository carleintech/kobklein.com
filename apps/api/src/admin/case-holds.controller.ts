import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { AuditService } from "../audit/audit.service";
import { createNotification } from "../notifications/notification.service";

@Controller("admin/cases")
export class CaseHoldsController {
  constructor(private auditService: AuditService) {}

  /**
   * Release held funds — case cleared, recipient gets funds back
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post(":id/release-hold")
  async releaseHold(@Req() req: any, @Param("id") caseId: string) {
    const adminUserId = req.localUser?.id;

    // Find the hold_debit entry for this case
    const holdEntry = await prisma.ledgerEntry.findFirst({
      where: { reference: caseId, type: "hold_debit" },
    });

    if (!holdEntry) {
      throw new Error("No held funds found for this case");
    }

    // Check not already released/seized
    const existing = await prisma.ledgerEntry.findFirst({
      where: {
        reference: caseId,
        type: { in: ["hold_release", "hold_seize"] },
      },
    });

    if (existing) {
      throw new Error("Hold already resolved");
    }

    const amount = Math.abs(Number(holdEntry.amount));

    // Create release entry (restores available balance)
    await prisma.ledgerEntry.create({
      data: {
        walletId: holdEntry.walletId,
        amount: amount,
        type: "hold_release",
        reference: caseId,
      },
    });

    // Record case action
    await prisma.caseAction.create({
      data: {
        caseId,
        actionType: "release_hold",
        actorUserId: adminUserId,
        meta: { walletId: holdEntry.walletId, amount },
      },
    });

    // Notify wallet owner
    const wallet = await prisma.wallet.findUnique({
      where: { id: holdEntry.walletId },
    });

    if (wallet) {
      await createNotification(
        wallet.userId,
        "Funds Released",
        "The hold on your funds has been lifted. Your balance is now fully available.",
        "system",
      );
    }

    await this.auditService.logFinancialAction({
      actorUserId: adminUserId,
      eventType: "hold_released",
      amount,
      referenceId: caseId,
      meta: { walletId: holdEntry.walletId },
    });

    return { ok: true, action: "hold_released", amount };
  }

  /**
   * Seize held funds — fraud confirmed, funds taken from recipient
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post(":id/seize-hold")
  async seizeHold(
    @Req() req: any,
    @Param("id") caseId: string,
    @Body() body: { refundToUserId?: string },
  ) {
    const adminUserId = req.localUser?.id;

    const holdEntry = await prisma.ledgerEntry.findFirst({
      where: { reference: caseId, type: "hold_debit" },
    });

    if (!holdEntry) {
      throw new Error("No held funds found for this case");
    }

    const existing = await prisma.ledgerEntry.findFirst({
      where: {
        reference: caseId,
        type: { in: ["hold_release", "hold_seize"] },
      },
    });

    if (existing) {
      throw new Error("Hold already resolved");
    }

    const amount = Math.abs(Number(holdEntry.amount));

    // Seize: finalize the loss on recipient's wallet
    await prisma.ledgerEntry.create({
      data: {
        walletId: holdEntry.walletId,
        amount: -amount,
        type: "hold_seize",
        reference: caseId,
      },
    });

    // Record case action
    await prisma.caseAction.create({
      data: {
        caseId,
        actionType: "seize_funds",
        actorUserId: adminUserId,
        meta: { walletId: holdEntry.walletId, amount },
      },
    });

    // If refund requested, credit the victim's wallet
    if (body.refundToUserId) {
      const victimWallet = await prisma.wallet.findFirst({
        where: { userId: body.refundToUserId, type: "USER" },
      });

      if (victimWallet) {
        await prisma.ledgerEntry.create({
          data: {
            walletId: victimWallet.id,
            amount: amount,
            type: "refund",
            reference: caseId,
          },
        });

        await createNotification(
          body.refundToUserId,
          "Refund Processed",
          `Your disputed funds of ${amount} HTG have been returned to your account.`,
          "system",
        );

        await prisma.caseAction.create({
          data: {
            caseId,
            actionType: "refund_processed",
            actorUserId: adminUserId,
            meta: {
              walletId: victimWallet.id,
              amount,
              refundToUserId: body.refundToUserId,
            },
          },
        });
      }
    }

    // Notify recipient of seizure
    const wallet = await prisma.wallet.findUnique({
      where: { id: holdEntry.walletId },
    });

    if (wallet) {
      await createNotification(
        wallet.userId,
        "Funds Seized",
        "Following our investigation, the held funds have been removed from your account.",
        "security",
      );
    }

    await this.auditService.logFinancialAction({
      actorUserId: adminUserId,
      eventType: "hold_seized",
      amount,
      referenceId: caseId,
      meta: {
        walletId: holdEntry.walletId,
        refundToUserId: body.refundToUserId,
      },
    });

    return { ok: true, action: "hold_seized", amount, refunded: !!body.refundToUserId };
  }
}
