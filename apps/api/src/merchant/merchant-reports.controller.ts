import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { prisma } from "../db/prisma";
import type { Response } from "express";

/**
 * Merchant Settlement Reports
 *
 * Computes gross revenue, fees, and net from the merchant's own ledger entries.
 * Ledger is the single source of truth — no balance field used.
 */
@Controller("v1/merchant/reports")
export class MerchantReportsController {
  /**
   * GET /v1/merchant/reports/settlement?from=2025-01-01&to=2025-12-31
   *
   * Returns settlement summary + line items for the authenticated merchant.
   */
  @UseGuards(Auth0Guard)
  @Get("settlement")
  async settlement(
    @Req() req: any,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new Error("Merchant not found");

    const merchantWallet = await prisma.wallet.findFirst({
      where: { userId, type: "MERCHANT" },
    });
    if (!merchantWallet) throw new Error("Merchant wallet not found");

    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Merchant payment credits (net amount merchant received)
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        walletId: merchantWallet.id,
        type: "merchant_payment",
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        amount: true,
        type: true,
        reference: true,
        createdAt: true,
      },
    });

    const totalNet = entries.reduce(
      (sum, e) => sum + Math.abs(Number(e.amount)),
      0,
    );

    // Fee entries that went to treasury for this merchant's transactions
    // We match via reference field (e.g. "pos_XXXXX" references)
    const references = entries
      .map((e) => e.reference)
      .filter((r): r is string => !!r);

    let totalFee = 0;
    if (references.length > 0) {
      const feeEntries = await prisma.ledgerEntry.findMany({
        where: {
          type: "merchant_fee",
          reference: { in: references },
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: { amount: true },
      });

      totalFee = feeEntries.reduce(
        (sum, e) => sum + Math.abs(Number(e.amount)),
        0,
      );
    }

    const totalGross = totalNet + totalFee;

    return {
      ok: true,
      merchantName: merchant.businessName,
      period: { from: fromDate, to: toDate },
      transactionCount: entries.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalFee: Math.round(totalFee * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      entries: entries.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        type: e.type,
        reference: e.reference,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * GET /v1/merchant/reports/settlement/export?from=2025-01-01&to=2025-12-31
   *
   * Returns CSV string of settlement entries.
   */
  @UseGuards(Auth0Guard)
  @Get("settlement/export")
  async exportCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const data = await this.settlement(req, from, to);

    const header = "Date,Type,Amount,Reference\n";
    const rows = data.entries
      .map(
        (e: any) =>
          `${new Date(e.createdAt).toISOString()},${e.type},${e.amount},${e.reference || ""}`,
      )
      .join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="settlement-${data.period.from.toISOString().slice(0, 10)}_${data.period.to.toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }
}
