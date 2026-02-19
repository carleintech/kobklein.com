import { Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { computeTrustScore } from "../risk/trust-score.service";

@Controller("v1/recipients")
export class RecipientsController {
  /**
   * Smart recipients list: favorites first, then most frequent, then recent.
   * Enriched with trust score for each recipient.
   */
  @UseGuards(SupabaseGuard)
  @Get("smart")
  async smart(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const list = await prisma.transferContact.findMany({
      where: { userId },
      orderBy: [
        { isFavorite: "desc" },
        { transferCount: "desc" },
        { lastTransferAt: "desc" },
      ],
      take: 20,
      include: {
        User_TransferContact_contactUserIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            phone: true,
          },
        },
      },
    });

    // Enrich with trust scores
    const enriched = await Promise.all(
      list.map(async (r) => {
        const trust = await computeTrustScore(r.contactUserId);
        return {
          id: r.id,
          contactUserId: r.contactUserId,
          nickname: r.nickname,
          isFavorite: r.isFavorite,
          transferCount: r.transferCount,
          lastTransferAt: r.lastTransferAt,
          user: r.User_TransferContact_contactUserIdToUser,
          trust,
        };
      }),
    );

    return enriched;
  }

  /**
   * Mark a contact as favorite.
   */
  @UseGuards(SupabaseGuard)
  @Post(":id/favorite")
  async favorite(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const contact = await prisma.transferContact.findFirst({
      where: { id, userId },
    });
    if (!contact) throw new Error("Contact not found");

    await prisma.transferContact.update({
      where: { id },
      data: { isFavorite: true },
    });

    return { ok: true };
  }

  /**
   * Remove favorite.
   */
  @UseGuards(SupabaseGuard)
  @Delete(":id/favorite")
  async unfavorite(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const contact = await prisma.transferContact.findFirst({
      where: { id, userId },
    });
    if (!contact) throw new Error("Contact not found");

    await prisma.transferContact.update({
      where: { id },
      data: { isFavorite: false },
    });

    return { ok: true };
  }
}
