import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { computeWalletBalance } from "./balance.service";

@Controller("wallets")
export class WalletBalanceController {
  @UseGuards(Auth0Guard)
  @Get("balance")
  async balance(@Req() req: any) {
    const userId = req.user.sub;

    const wallet = await prisma.wallet.findFirst({
      where: { userId, type: "USER" },
    });

    if (!wallet) return null;

    return computeWalletBalance(wallet.id);
  }
}