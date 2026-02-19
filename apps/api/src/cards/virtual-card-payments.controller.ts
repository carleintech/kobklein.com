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
import { SupabaseGuard } from "../auth/supabase.guard";
import { AuditService } from "../audit/audit.service";
import { authorizeCardTransaction, reverseAuthorization } from "./authorize.service";
import { captureCardTransaction } from "./capture.service";
import { verifyCvv } from "./crypto";

@Controller("v1/cards")
export class VirtualCardPaymentsController {
  constructor(private auditService: AuditService) {}

  /**
   * Authorize a transaction on a virtual card.
   *
   * In production this endpoint is called by the card network processor,
   * not the end user. For MVP, the client simulates merchant charges.
   */
  @UseGuards(SupabaseGuard)
  @Post(":cardId/authorize")
  async authorize(
    @Req() req: any,
    @Param("cardId") cardId: string,
    @Body()
    body: {
      amount: number;
      currency?: string;
      cvv: string;
      merchantName?: string;
      merchantCategory?: string;
      merchantCountry?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Verify card ownership
    const card = await prisma.virtualCard.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card not found");
    if (card.userId !== userId) throw new Error("Not your card");

    // Verify CVV
    const cvvValid = verifyCvv(body.cvv, card.cvvHash);
    if (!cvvValid) throw new Error("Invalid CVV");

    const result = await authorizeCardTransaction({
      cardId,
      amount: body.amount,
      currency: body.currency || card.currency,
      merchantName: body.merchantName,
      merchantCategory: body.merchantCategory,
      merchantCountry: body.merchantCountry,
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: result.ok ? "card_authorization_approved" : "card_authorization_declined",
      amount: body.amount,
      currency: body.currency || card.currency,
      referenceId: result.txn.id,
      meta: {
        cardId,
        merchantName: body.merchantName,
        reason: result.ok ? undefined : (result as any).reason,
      },
    });

    return result;
  }

  /**
   * Capture (settle) a previously authorized transaction.
   */
  @UseGuards(SupabaseGuard)
  @Post(":cardId/transactions/:txnId/capture")
  async capture(
    @Req() req: any,
    @Param("cardId") cardId: string,
    @Param("txnId") txnId: string,
    @Body() body: { captureAmount?: number },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Verify ownership
    const txn = await prisma.virtualCardTxn.findUnique({ where: { id: txnId } });
    if (!txn) throw new Error("Transaction not found");
    if (txn.cardId !== cardId) throw new Error("Transaction does not belong to this card");
    if (txn.userId !== userId) throw new Error("Not your transaction");

    const result = await captureCardTransaction({
      txnId,
      captureAmount: body.captureAmount,
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "card_capture",
      amount: result.captureAmount,
      referenceId: txnId,
      meta: { cardId, authorizedAmount: result.authorizedAmount },
    });

    return result;
  }

  /**
   * Reverse an authorized hold.
   */
  @UseGuards(SupabaseGuard)
  @Post(":cardId/transactions/:txnId/reverse")
  async reverse(
    @Req() req: any,
    @Param("cardId") cardId: string,
    @Param("txnId") txnId: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    const txn = await prisma.virtualCardTxn.findUnique({ where: { id: txnId } });
    if (!txn) throw new Error("Transaction not found");
    if (txn.cardId !== cardId) throw new Error("Transaction does not belong to this card");
    if (txn.userId !== userId) throw new Error("Not your transaction");

    const result = await reverseAuthorization(txnId);

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "card_authorization_reversed",
      amount: Number(txn.amount),
      referenceId: txnId,
      meta: { cardId },
    });

    return result;
  }

  /**
   * List transactions for a card.
   */
  @UseGuards(SupabaseGuard)
  @Get(":cardId/transactions")
  async listTransactions(
    @Req() req: any,
    @Param("cardId") cardId: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Verify ownership
    const card = await prisma.virtualCard.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card not found");
    if (card.userId !== userId) throw new Error("Not your card");

    return prisma.virtualCardTxn.findMany({
      where: { cardId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        merchantName: true,
        merchantCategory: true,
        merchantCountry: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
