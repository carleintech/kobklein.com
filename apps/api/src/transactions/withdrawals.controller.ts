import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { StepUpGuard } from "../auth/stepup.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { requestWithdrawal, approveWithdrawal } from "./withdrawal.service";
import { pool } from "../db/pool";
import { AuditService } from "../audit/audit.service";

@Controller()
export class WithdrawalsController {
  constructor(private auditService: AuditService) {}
  // Client: request cash-out (step-up required — trusted device bypass or OTP)
  @UseGuards(Auth0Guard, StepUpGuard)
  @Post("v1/withdrawals")
  async request(@Req() req: any, @Body() body: any) {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString();
    const userAgent = req.headers["user-agent"]?.toString();

    const result = await requestWithdrawal({
      userId: req.localUser.id,
      walletId: String(body.walletId),
      amount: Number(body.amount),
      currency: String(body.currency),
      ip,
      userAgent,
      requestId: req.requestId,
    });

    // Audit logging for withdrawal request
    await this.auditService.logFinancialAction({
      actorUserId: req.localUser.id,
      eventType: "withdrawal_requested",
      amount: Number(body.amount),
      currency: String(body.currency),
      fromWalletId: String(body.walletId),
      referenceId: result.withdrawalId,
      ip,
      userAgent,
      meta: { code: result.code },
    });

    return result;
  }

  // Distributor: list pending withdrawals (basic view)
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("distributor")
  @Get("distributor/withdrawals")
  async listPending() {
    const result = await pool.query(`
      SELECT * FROM "Withdrawal"
      WHERE status = $1 AND "expiresAt" > now()
      ORDER BY "createdAt" DESC
      LIMIT 50
    `, ["pending"]);
    return result.rows;
  }

  // Distributor: approve by code
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("distributor")
  @Post("distributor/withdrawals/:code/approve")
  async approve(@Req() req: any, @Param("code") code: string) {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString();
    const userAgent = req.headers["user-agent"]?.toString();

    const result = await approveWithdrawal({
      distributorUserId: req.localUser.id,
      code,
      ip,
      userAgent,
      requestId: req.requestId,
    });

    // Get withdrawal details for audit logging
    const withdrawalResult = await pool.query(`
      SELECT w.*, u.phone as userPhone
      FROM "Withdrawal" w
      JOIN "User" u ON u.id = w."userId"
      WHERE w.id = $1
    `, [result.withdrawalId]);
    const withdrawal = withdrawalResult.rows[0];

    // Audit logging for withdrawal approval
    await this.auditService.logFinancialAction({
      actorUserId: req.localUser.id,
      eventType: "withdrawal_approved",
      amount: Number(withdrawal.amount),
      currency: withdrawal.currency,
      fromWalletId: withdrawal.walletId,
      referenceId: result.withdrawalId,
      ip,
      userAgent,
      meta: { code, distributorUserId: req.localUser.id },
    });

    return result;
  }
}