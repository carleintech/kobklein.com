import { prisma } from "../db/prisma";

/**
 * Get the latest active FX rate for a currency pair.
 * Returns the rate as a number (uses `buy` rate if available, falls back to `rate`).
 *
 * Backward compatible — existing callers get the buy rate (user-receives rate).
 *
 * Example: getActiveFxRate("USD", "HTG") => 133.31
 */
export async function getActiveFxRate(
  from: string,
  to: string,
): Promise<number> {
  const rate = await prisma.fxRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!rate) {
    throw new Error(`FX rate not configured for ${from} -> ${to}`);
  }

  // Use buy rate if spread is configured, otherwise legacy rate field
  return rate.buy ? Number(rate.buy) : Number(rate.rate);
}

/**
 * Get the full FX rate record (mid, buy, sell, spread).
 * Used by admin dashboard and FX conversion engine.
 */
export async function getActiveFxRateFull(from: string, to: string) {
  const rate = await prisma.fxRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!rate) {
    throw new Error(`FX rate not configured for ${from} -> ${to}`);
  }

  return {
    id: rate.id,
    fromCurrency: rate.fromCurrency,
    toCurrency: rate.toCurrency,
    mid: rate.mid ? Number(rate.mid) : Number(rate.rate),
    buy: rate.buy ? Number(rate.buy) : Number(rate.rate),
    sell: rate.sell ? Number(rate.sell) : Number(rate.rate),
    spreadBps: rate.spreadBps,
    source: rate.source,
    createdAt: rate.createdAt,
  };
}

/**
 * Convert an amount from one currency to another using the active rate.
 * Returns the converted amount and the rate used (for audit trail).
 *
 * Backward compatible — used by existing code.
 */
export async function convertAmount(
  amountFrom: number,
  from: string,
  to: string,
): Promise<{ amountTo: number; rate: number }> {
  const rate = await getActiveFxRate(from, to);
  const amountTo = Math.round(amountFrom * rate * 100) / 100;

  return { amountTo, rate };
}

/**
 * Convert with full audit trail and profit capture (Phase 44-45).
 *
 * Records FxConversion entry and calculates platform profit from spread.
 * Profit = (midRate - buyRate) × amount = spread revenue.
 *
 * Optionally credits profit to the treasury TREASURY wallet.
 */
export async function convertWithAudit(params: {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  reference?: string;
  creditTreasury?: boolean; // default true
}): Promise<{
  toAmount: number;
  rateUsed: number;
  midRate: number;
  profit: number;
  conversionId: string;
}> {
  const fx = await getActiveFxRateFull(params.fromCurrency, params.toCurrency);

  const toAmount = Math.round(params.fromAmount * fx.buy * 100) / 100;
  const midAmount = Math.round(params.fromAmount * fx.mid * 100) / 100;
  const profit = Math.round((midAmount - toAmount) * 100) / 100;

  const shouldCreditTreasury = params.creditTreasury !== false;

  const conversion = await prisma.$transaction(async (tx) => {
    // Record conversion
    const conv = await tx.fxConversion.create({
      data: {
        userId: params.userId,
        fromCurrency: params.fromCurrency,
        toCurrency: params.toCurrency,
        fromAmount: params.fromAmount,
        toAmount,
        rateUsed: fx.buy,
        spreadBps: fx.spreadBps,
        profit,
        reference: params.reference,
      },
    });

    // Credit FX profit to treasury wallet
    if (shouldCreditTreasury && profit > 0) {
      const treasuryWallet = await tx.wallet.findFirst({
        where: { type: "TREASURY", currency: params.toCurrency },
      });

      if (treasuryWallet) {
        await tx.ledgerEntry.create({
          data: {
            walletId: treasuryWallet.id,
            amount: profit,
            type: "fx_profit",
            reference: `fx_conv:${conv.id}`,
          },
        });
      }
    }

    return conv;
  });

  return {
    toAmount,
    rateUsed: fx.buy,
    midRate: fx.mid,
    profit,
    conversionId: conversion.id,
  };
}
