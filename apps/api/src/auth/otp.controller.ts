import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "./supabase.guard";
import { createOtp, verifyOtp } from "./otp.service";
import { prisma } from "../db/prisma";
import { enqueueSMS } from "../notifications/notification.service";

@Controller("auth")
export class OtpController {
  @UseGuards(SupabaseGuard)
  @Post("request-otp")
  async request(@Req() req: any, @Body() body: { purpose: string }) {
    const userId = req.user.sub;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.phone) throw new Error("No phone");

    const code = await createOtp(userId, body.purpose, user.phone);

    await enqueueSMS(user.phone, `KobKlein OTP: ${code}`);

    return { ok: true };
  }

  @UseGuards(SupabaseGuard)
  @Post("verify-otp")
  async verify(@Req() req: any, @Body() body: { code: string; purpose: string }) {
    const userId = req.user.sub;
    await verifyOtp({ userId, code: body.code, purpose: body.purpose });
    return { ok: true };
  }
}
