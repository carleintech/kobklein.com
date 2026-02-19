import { Controller, Get, Param } from "@nestjs/common";
import { prisma } from "../db/prisma";

@Controller("public/merchant")
export class MerchantPublicController {
  @Get(":id")
  async get(@Param("id") id: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!merchant) return { error: "Not found" };

    return {
      id: merchant.id,
      name: merchant.businessName,
      logo: merchant.logoUrl,
      verified: merchant.kycStatus === "approved",
    };
  }
}