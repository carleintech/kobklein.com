import { BadRequestException, Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { consumeOtpChallenge } from "../otp/otp-challenge.service";
import { executeTransfer } from "./transfer-execution.service";

@Controller("v1/transfers")
export class TransferConfirmController {
  constructor(private auditService: AuditService) {}

  /**
   * Step 2: Confirm a transfer after OTP verification.
   * Consumes the challenge payload and executes the transfer.
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("confirm")
  async confirm(
    @Req() req: any,
    @Body() body: {
      challengeId: string;
      otpCode: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Known business errors that should return 400 (not 500)
    const BUSINESS_ERRORS = [
      "Insufficient balance",
      "Sender account is frozen",
      "Recipient account is frozen",
      "Invalid challenge",
      "Challenge already used",
      "Challenge expired",
      "Invalid OTP",
      "OTP not found",
      "OTP expired",
      "Too many attempts",
      "Cannot transfer to yourself",
      "Amount must be positive",
    ];

    let payload: Record<string, any>;
    try {
      payload = await consumeOtpChallenge({
        userId,
        challengeId: body.challengeId,
        otpCode: body.otpCode,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      throw new BadRequestException(msg);
    }

    let result: { transferId?: string };
    try {
      result = await executeTransfer({
        senderUserId: userId,
        recipientUserId: payload.recipientUserId,
        amount: payload.amount,
        currency: payload.currency,
        idempotencyKey: payload.idempotencyKey,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      if (BUSINESS_ERRORS.some((e) => msg.includes(e))) {
        throw new BadRequestException(msg);
      }
      throw err;
    }

    // Audit
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "transfer_confirmed_otp",
      amount: payload.amount,
      currency: payload.currency,
      referenceId: result.transferId,
      ip: req.ip,
      userAgent: req.headers?.["user-agent"],
      meta: { challengeId: body.challengeId },
    });

    return {
      ok: true,
      transferId: result.transferId,
    };
  }
}
