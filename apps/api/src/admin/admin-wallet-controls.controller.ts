import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";

/**
 * Admin Manual Wallet Controls
 * POST /v1/admin/wallets/adjust  — credit or debit any wallet
 */
@Controller("v1/admin/wallets")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminWalletControlsController {
  constructor(private auditService: AuditService) {}

  @Post("adjust")
  async adjust(
    @Req() req: any,
    @Body()
    body: {
      userId: string;
      currency: string;
      direction: "credit" | "debit";
      amount: number;
      reason: string;
    },
  ) {
    const { userId, currency, direction, amount, reason } = body;

    if (!userId || !currency || !direction || !amount || !reason) {
      throw new BadRequestException("Missing required fields");
    }
    if (amount <= 0) throw new BadRequestException("Amount must be positive");
    if (!["credit", "debit"].includes(direction)) {
      throw new BadRequestException("Direction must be credit or debit");
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!wallet) throw new NotFoundException("Wallet not found");

    // Compute current balance from ledger
    const agg = await prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });
    const currentBalance = Number(agg._sum.amount ?? 0);

    if (direction === "debit" && currentBalance < amount) {
      throw new BadRequestException("Insufficient wallet balance for debit");
    }

    const ledgerAmount = direction === "credit" ? amount : -amount;

    await prisma.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: ledgerAmount,
        type: "admin_adjustment",
        reference: `admin:${req.localUser?.id}:${direction}:${reason.slice(0, 80)}`,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "admin_wallet_adjustment",
      amount,
      currency,
      meta: { targetUserId: userId, direction, reason },
    });

    const newBalance = currentBalance + ledgerAmount;
    return {
      ok: true,
      walletId: wallet.id,
      direction,
      amount,
      currency,
      newBalance,
    };
  }
}
