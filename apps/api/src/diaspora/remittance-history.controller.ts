import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";

/** Shape of each month's remittance data — named to avoid inline-type `never[]` inference */
type RemittanceMonthEntry = {
  month: string;
  sent: number;
  savedVsWesternUnion: number;
};

/**
 * GET /v1/diaspora/remittance-history?months=6
 *
 * Returns monthly remittance data for the diaspora dashboard chart.
 * Replaces the random/mock chart data previously used in diaspora.tsx.
 *
 * Response: Array of { month: "2025-09", sent: 450, savedVsWesternUnion: 54 }
 * sorted oldest → newest (ready for recharts LineChart / BarChart).
 */
@Controller("v1/diaspora")
@UseGuards(SupabaseGuard)
export class RemittanceHistoryController {
  @Get("remittance-history")
  async remittanceHistory(
    @Req() req: any,
    @Query("months") monthsParam?: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const months = Math.min(Math.max(parseInt(monthsParam ?? "6", 10), 1), 24);

    // Build date range: last N months
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Find all USD wallets owned by this diaspora user
    const senderWallets = await prisma.wallet.findMany({
      where: { userId, currency: "USD", type: "USER" },
      select: { id: true },
    });
    const senderWalletIds = senderWallets.map((w) => w.id);

    if (!senderWalletIds.length) {
      return buildEmptyMonths(now, months);
    }

    // Fetch all completed outgoing transfers in the date range
    const transfers = await prisma.transfer.findMany({
      where: {
        fromWalletId: { in: senderWalletIds },
        status: { in: ["completed", "posted"] },
        createdAt: { gte: since },
      },
      select: { amount: true, currency: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by YYYY-MM
    const grouped: Record<string, number> = {};
    for (const t of transfers) {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = (grouped[key] ?? 0) + Number(t.amount);
    }

    // Build ordered array with all N months (0 for months with no transfers)
    const result: RemittanceMonthEntry[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const sent = grouped[key] ?? 0;

      // Estimated savings vs Western Union (~$9 flat fee they would charge)
      // KobKlein charges ~$1.99, so savings = 9 - 1.99 = $7.01 per transfer
      // We estimate number of transfers that month if avg transfer ~$100
      const estimatedTransferCount = sent > 0 ? Math.max(1, Math.round(sent / 120)) : 0;
      const savedVsWesternUnion = Math.round(estimatedTransferCount * 7.01 * 100) / 100;

      result.push({ month: label, sent: Math.round(sent * 100) / 100, savedVsWesternUnion });
    }

    return { months: result, totalSent: result.reduce((s, r) => s + r.sent, 0) };
  }
}

function buildEmptyMonths(now: Date, months: number) {
  const entries: RemittanceMonthEntry[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const entry: RemittanceMonthEntry = { month: label, sent: 0, savedVsWesternUnion: 0 };
    entries.push(entry);
  }
  return { months: entries, totalSent: 0 };
}
