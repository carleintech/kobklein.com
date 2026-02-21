import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("v1/transfers")
export class RecipientCheckController {
  /**
   * Resolve a phone number, K-ID (KK-XXXX-XXXX), or @handle to a recipient.
   * Returns { exists, recipientId, firstName, lastName, handle, isNew }
   */
  @UseGuards(SupabaseGuard)
  @Post("check-recipient")
  async check(@Req() req: any, @Body() body: { query: string }) {
    const senderId = req.localUser?.id || req.user?.sub;
    const raw = (body.query || "").trim();

    if (!raw) return { exists: false };

    // Build OR conditions: phone, K-ID, or @handle
    const handle = raw.startsWith("@") ? raw.slice(1) : raw;

    const recipient = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: raw },
          { kId: raw.toUpperCase() },
          { handle: { equals: handle, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        handle: true,
        kId: true,
        phone: true,
        kycTier: true,
      },
    });

    if (!recipient) return { exists: false };

    // Don't allow sending to yourself
    if (recipient.id === senderId) return { exists: false, selfMatch: true };

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
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      handle: recipient.handle,
      kId: recipient.kId,
      kycTier: recipient.kycTier,
    };
  }
}
