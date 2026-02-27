import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { postDeposit } from "./deposit.service";

@Controller("v1")
export class WalletsController {
  @UseGuards(SupabaseGuard)
  @Post("deposits")
  async deposit(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    return postDeposit({
      walletId: body.walletId,
      amount: Number(body.amount),
      currency: String(body.currency),
      source: "manual",
      idempotencyKey: String(idempotencyKey),
    });
  }
}
