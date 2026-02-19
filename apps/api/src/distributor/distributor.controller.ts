import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("v1/distributor")
export class DistributorController {
  @UseGuards(SupabaseGuard)
  @Post("apply")
  async apply(
    @Req() req: any,
    @Body() body: {
      displayName?: string;
      businessName?: string;
      locationText?: string;
    }
  ) {
    const userId = req.user.sub;

    const existing = await prisma.distributor.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error("Already applied or distributor exists");
    }

    const distributor = await prisma.distributor.create({
      data: {
        userId,
        displayName: body.displayName ?? "",
        businessName: body.businessName ?? "",
        locationText: body.locationText ?? "",
        status: "pending",
      },
    });

    return { success: true, distributor };
  }
}
