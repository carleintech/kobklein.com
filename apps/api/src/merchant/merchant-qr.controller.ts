import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { generateMerchantQR } from "./merchant-qr.service";

@Controller("merchant")
export class MerchantQRController {
  @UseGuards(Auth0Guard)
  @Get("qr")
  async getQR(@Req() req: any) {
    const merchant = await prisma.merchant.findFirst({
      where: { userId: req.user.sub },
    });

    if (!merchant) return { error: "Merchant not found" };

    const qr = await generateMerchantQR(merchant.id);

    return { qr };
  }
}