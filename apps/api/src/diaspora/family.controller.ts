import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { executeTransfer } from "../transfers/transfer-execution.service";
import { withIdempotency } from "../idempotency/idempotency.service";
import { createNotification } from "../notifications/notification.service";

@Controller("v1/family")
export class FamilyController {
  /**
   * K-Link: Add a family member by phone or handle.
   */
  @UseGuards(Auth0Guard)
  @Post("link")
  async addFamilyMember(
    @Req() req: any,
    @Body()
    body: {
      phoneOrHandle: string;
      nickname?: string;
      relationship?: string;
    },
  ) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    // Find family member by phone, handle, or K-ID
    const familyUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: body.phoneOrHandle },
          { handle: body.phoneOrHandle },
          { kId: body.phoneOrHandle },
        ],
      },
    });

    if (!familyUser) {
      throw new Error("User not found. They must have a KobKlein account.");
    }

    if (familyUser.id === diasporaUserId) {
      throw new Error("You cannot add yourself as a family member.");
    }

    // Check if already linked
    const existing = await prisma.familyLink.findUnique({
      where: {
        diasporaUserId_familyUserId: {
          diasporaUserId,
          familyUserId: familyUser.id,
        },
      },
    });

    if (existing) {
      throw new Error("This family member is already linked.");
    }

    const link = await prisma.familyLink.create({
      data: {
        diasporaUserId,
        familyUserId: familyUser.id,
        nickname: body.nickname,
        relationship: body.relationship,
      },
    });

    // Notify the family member
    await createNotification(
      familyUser.id,
      "Family Link",
      "A family member has connected with you on KobKlein K-Link!",
      "system",
    );

    return {
      ok: true,
      linkId: link.id,
      familyUser: {
        id: familyUser.id,
        firstName: familyUser.firstName,
        handle: familyUser.handle,
      },
    };
  }

  /**
   * Get all linked family members.
   */
  @UseGuards(Auth0Guard)
  @Get("members")
  async getMembers(@Req() req: any) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    const links = await prisma.familyLink.findMany({
      where: { diasporaUserId },
      include: {
        familyUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            handle: true,
            kycTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get wallet balances for each member (so diaspora can see who needs money)
    const enriched = await Promise.all(
      links.map(async (link) => {
        const wallet = await prisma.wallet.findFirst({
          where: { userId: link.familyUserId, currency: "HTG" },
        });

        // Get recent transfers to this member
        const senderWallets = await prisma.wallet.findMany({
          where: { userId: diasporaUserId },
          select: { id: true },
        });
        const recipientWallets = await prisma.wallet.findMany({
          where: { userId: link.familyUserId },
          select: { id: true },
        });
        const recentTransfers = await prisma.transfer.findMany({
          where: {
            fromWalletId: { in: senderWallets.map((w) => w.id) },
            toWalletId: { in: recipientWallets.map((w) => w.id) },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            amount: true,
            createdAt: true,
            status: true,
          },
        });

        return {
          id: link.id,
          nickname: link.nickname,
          relationship: link.relationship,
          createdAt: link.createdAt,
          familyUser: link.familyUser,
          recentTransfers,
          walletId: wallet?.id,
        };
      }),
    );

    return enriched;
  }

  /**
   * Update a family link (nickname, relationship).
   */
  @UseGuards(Auth0Guard)
  @Patch(":linkId")
  async updateLink(
    @Req() req: any,
    @Param("linkId") linkId: string,
    @Body() body: { nickname?: string; relationship?: string },
  ) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    const link = await prisma.familyLink.findFirst({
      where: { id: linkId, diasporaUserId },
    });

    if (!link) throw new Error("Link not found");

    await prisma.familyLink.update({
      where: { id: linkId },
      data: {
        nickname: body.nickname ?? link.nickname,
        relationship: body.relationship ?? link.relationship,
      },
    });

    return { ok: true };
  }

  /**
   * Remove a family link.
   */
  @UseGuards(Auth0Guard)
  @Delete(":linkId")
  async removeLink(@Req() req: any, @Param("linkId") linkId: string) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    const link = await prisma.familyLink.findFirst({
      where: { id: linkId, diasporaUserId },
    });

    if (!link) throw new Error("Link not found");

    await prisma.familyLink.delete({ where: { id: linkId } });

    return { ok: true };
  }

  /**
   * Quick send to family member (K-Link transfer).
   * Lower friction than regular send — skips recipient search.
   */
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post("send")
  async sendToFamily(
    @Req() req: any,
    @Body()
    body: {
      familyLinkId: string;
      amount: number;
      currency: string;
      idempotencyKey: string;
    },
  ) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    const link = await prisma.familyLink.findFirst({
      where: { id: body.familyLinkId, diasporaUserId },
      include: {
        familyUser: {
          select: { id: true, firstName: true, handle: true },
        },
      },
    });

    if (!link) throw new Error("Family link not found");

    const result = await withIdempotency({
      userId: diasporaUserId,
      route: "POST:/v1/family/send",
      key: body.idempotencyKey,
      body,
      run: async () => {
        const transfer = await executeTransfer({
          senderUserId: diasporaUserId,
          recipientUserId: link.familyUserId,
          amount: body.amount,
          currency: body.currency,
          idempotencyKey: body.idempotencyKey,
        });

        return {
          ok: true,
          transferId: transfer.transferId,
          recipientName:
            link.nickname ||
            link.familyUser.firstName ||
            link.familyUser.handle,
        };
      },
    });

    return result;
  }

  /**
   * Diaspora dashboard: summary of family, recent activity, total sent.
   */
  @UseGuards(Auth0Guard)
  @Get("dashboard")
  async diasporaDashboard(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    // Family count
    const familyCount = await prisma.familyLink.count({
      where: { diasporaUserId: userId },
    });

    // Wallet balance
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currency: "HTG" },
    });

    let balance = 0;
    if (wallet) {
      const entries = await prisma.ledgerEntry.findMany({
        where: { walletId: wallet.id },
        select: { amount: true },
      });
      balance = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    }

    // Total sent to family (all time)
    const familyLinks = await prisma.familyLink.findMany({
      where: { diasporaUserId: userId },
      select: { familyUserId: true },
    });

    const familyIds = familyLinks.map((l) => l.familyUserId);

    // Get user's wallets
    const myWallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });
    const myWalletIds = myWallets.map((w) => w.id);

    let totalSentToFamily = 0;
    if (familyIds.length > 0) {
      const familyWallets = await prisma.wallet.findMany({
        where: { userId: { in: familyIds } },
        select: { id: true },
      });
      const familyWalletIds = familyWallets.map((w) => w.id);

      const transfers = await prisma.transfer.findMany({
        where: {
          fromWalletId: { in: myWalletIds },
          toWalletId: { in: familyWalletIds },
          status: "posted",
        },
        select: { amount: true },
      });
      totalSentToFamily = transfers.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );
    }

    // Recent transfers
    const recentTransfers = await prisma.transfer.findMany({
      where: { fromWalletId: { in: myWalletIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        status: true,
        senderUserId: true,
        toWalletId: true,
      },
    });

    // Pending requests from family
    const pendingRequests = await prisma.paymentRequest.findMany({
      where: {
        requesteeId: userId,
        status: "pending",
        requesterId: { in: familyIds },
      },
      include: {
        requester: {
          select: { id: true, firstName: true, handle: true },
        },
      },
      take: 10,
    });

    return {
      familyCount,
      balance,
      totalSentToFamily,
      walletId: wallet?.id,
      recentTransfers,
      pendingRequests,
    };
  }
}
