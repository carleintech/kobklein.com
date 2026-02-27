import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { MoncashService } from "./moncash.service";
import { NatcomService } from "./natcom.service";
import { SogebankService } from "./sogebank.service";
import { LocalPaymentProvider } from "./local-payment.interface";
import { pool } from "../db/pool";
import { postDeposit } from "../wallets/deposit.service";

@Controller("v1/local-payment")
export class LocalPaymentController {
  constructor(
    private readonly moncash: MoncashService,
    private readonly natcom: NatcomService,
    private readonly sogebank: SogebankService,
  ) {}

  private getProvider(name: string): LocalPaymentProvider {
    if (name === "moncash") return this.moncash;
    if (name === "natcom") return this.natcom;
    if (name === "sogebank") return this.sogebank;
    throw new BadRequestException(`Unknown provider: ${name}. Supported: moncash, natcom, sogebank`);
  }

  @UseGuards(SupabaseGuard)
  @Post("initiate")
  async initiate(@Req() req: any, @Body() body: any) {
    const provider = String(body.provider || "").toLowerCase();
    const amount = Number(body.amount);
    const currency = String(body.currency || "HTG").toUpperCase();
    const userId = req.localUser.id;

    if (!provider) throw new BadRequestException("provider is required");
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException("amount must be positive");

    const svc = this.getProvider(provider);
    const result = await svc.initiate(userId, amount, currency);

    // Persist pending txn
    await pool.query(
      `INSERT INTO "LocalPaymentTxn" ("id", "userId", "provider", "orderId", "amount", "currency", "direction", "status", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'deposit', 'pending', now(), now())`,
      [userId, provider, result.orderId, amount, currency],
    );

    return result;
  }

  @UseGuards(SupabaseGuard)
  @Get("verify/:orderId")
  async verify(@Req() req: any, @Param("orderId") orderId: string) {
    const txnResult = await pool.query(
      `SELECT * FROM "LocalPaymentTxn" WHERE "orderId" = $1 AND "userId" = $2`,
      [orderId, req.localUser.id],
    );
    const txn = txnResult.rows[0];
    if (!txn) throw new BadRequestException("Transaction not found");

    const svc = this.getProvider(txn.provider);
    const result = await svc.verify(orderId);

    if (result.status === "confirmed" && txn.status === "pending") {
      await this.creditAndUpdate(txn, result.paidAmount ?? txn.amount);
    }

    return result;
  }

  async creditAndUpdate(txn: any, paidAmount: number) {
    // Look up the user's HTG wallet
    const walletResult = await pool.query(
      `SELECT id FROM "Wallet" WHERE "userId" = $1 AND currency = $2 LIMIT 1`,
      [txn.userId, txn.currency],
    );
    const wallet = walletResult.rows[0];
    if (!wallet) return;

    await postDeposit({
      walletId: wallet.id,
      amount: paidAmount,
      currency: txn.currency,
      source: txn.provider,
      reference: txn.orderId,
      idempotencyKey: `${txn.provider}:${txn.orderId}`,
    });

    await pool.query(
      `UPDATE "LocalPaymentTxn" SET "status" = 'confirmed', "updatedAt" = now() WHERE id = $1`,
      [txn.id],
    );
  }
}
