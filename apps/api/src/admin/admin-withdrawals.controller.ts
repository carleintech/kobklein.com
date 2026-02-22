import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

/**
 * Admin Withdrawals — list and approve pending cash-out codes.
 *
 * GET  admin/withdrawals/pending    — list all pending withdrawal codes
 * POST admin/withdrawals/:code/approve — mark a withdrawal as completed
 */
@Controller("v1/admin/withdrawals")
export class AdminWithdrawalsController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("pending")
  async pending() {
    const rows = await prisma.withdrawal.findMany({
      where: { status: "pending", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        code: true,
        amount: true,
        currency: true,
        status: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return rows.map((w) => ({ ...w, amount: Number(w.amount) }));
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":code/approve")
  async approve(@Param("code") code: string) {
    const w = await prisma.withdrawal.findFirst({ where: { code, status: "pending" } });
    if (!w) throw new Error("Withdrawal not found or already processed");

    await prisma.withdrawal.update({
      where: { id: w.id },
      data: { status: "completed" },
    });

    return { ok: true };
  }
}
