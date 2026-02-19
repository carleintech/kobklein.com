import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("transfers")
export class RecipientCheckController {
  @UseGuards(SupabaseGuard)
  @Post("check-recipient")
  async check(@Req() req: any, @Body() body: { phone: string }) {
    const senderId = req.user.sub;

    const recipient = await prisma.user.findFirst({
      where: { phone: body.phone },
    });

    if (!recipient) return { exists: false };

    const existing = await prisma.transferContact.findUnique({
      where: {
        userId_contactUserId: {
          userId: senderId,
          contactUserId: recipient.id,
        },
      },
    });

    return {
      exists: true,
      isNew: !existing,
      recipientId: recipient.id,
    };
  }
}
