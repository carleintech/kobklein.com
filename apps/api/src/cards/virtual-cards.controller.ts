import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { AuditService } from "../audit/audit.service";
import { generateCardNumber, generateCvv, last4 } from "./generate";
import { encryptCardNumber, sha256, hashCvv } from "./crypto";

@Controller("v1/cards")
export class VirtualCardsController {
  constructor(private auditService: AuditService) {}

  /**
   * Issue a new virtual card for the authenticated user.
   */
  @UseGuards(Auth0Guard)
  @Post()
  async create(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    // KYC gate — must be tier 2+
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycTier: true, isFrozen: true },
    });

    if (!user) throw new Error("User not found");
    if (user.isFrozen) throw new Error("Account is frozen");
    if ((user.kycTier ?? 0) < 2) {
      throw new Error("KYC tier 2 required to issue a virtual card");
    }

    // Ensure user has a USD wallet
    let wallet = await prisma.wallet.findFirst({
      where: { userId, currency: "USD", type: "USER" },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, currency: "USD", type: "USER" },
      });
    }

    // Limit: max 3 active cards per user
    const activeCount = await prisma.virtualCard.count({
      where: { userId, status: "active" },
    });

    if (activeCount >= 3) {
      throw new Error("Maximum 3 active cards allowed");
    }

    // Generate card details
    const plainCardNumber = generateCardNumber();
    const cvv = generateCvv();

    // Expiry: 3 years from now
    const now = new Date();
    const expiryMonth = now.getMonth() + 1; // 1-12
    const expiryYear = now.getFullYear() + 3;

    // Encrypt + hash for secure storage
    const cardNumberEnc = encryptCardNumber(plainCardNumber);
    const fingerprint = sha256(plainCardNumber);
    const cvvHash = hashCvv(cvv);

    const card = await prisma.virtualCard.create({
      data: {
        userId,
        cardNumberEnc,
        fingerprint,
        last4: last4(plainCardNumber),
        brand: "KOBKLEIN",
        expiryMonth,
        expiryYear,
        cvvHash,
        currency: "USD",
        status: "active",
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "virtual_card_created",
      referenceId: card.id,
    });

    // Return card details only ONCE — client must store securely
    return {
      id: card.id,
      cardNumber: plainCardNumber,
      cvv,
      last4: card.last4,
      expiryMonth,
      expiryYear,
      brand: card.brand,
      currency: card.currency,
      status: card.status,
    };
  }

  /**
   * List user's virtual cards (masked — no full number or CVV).
   */
  @UseGuards(Auth0Guard)
  @Get()
  async list(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    return prisma.virtualCard.findMany({
      where: { userId },
      select: {
        id: true,
        last4: true,
        brand: true,
        expiryMonth: true,
        expiryYear: true,
        currency: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single card (masked).
   */
  @UseGuards(Auth0Guard)
  @Get(":id")
  async getOne(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const card = await prisma.virtualCard.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        last4: true,
        brand: true,
        expiryMonth: true,
        expiryYear: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    if (!card) throw new Error("Card not found");
    if (card.userId !== userId) throw new Error("Not your card");

    return card;
  }

  /**
   * Freeze or unfreeze a card.
   */
  @UseGuards(Auth0Guard)
  @Post(":id/freeze")
  async freeze(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const card = await prisma.virtualCard.findUnique({ where: { id } });
    if (!card) throw new Error("Card not found");
    if (card.userId !== userId) throw new Error("Not your card");
    if (card.status === "canceled") throw new Error("Card is canceled");

    const newStatus = card.status === "frozen" ? "active" : "frozen";

    await prisma.virtualCard.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: newStatus === "frozen" ? "virtual_card_frozen" : "virtual_card_unfrozen",
      referenceId: id,
    });

    return { ok: true, status: newStatus };
  }

  /**
   * Cancel a card permanently.
   */
  @UseGuards(Auth0Guard)
  @Post(":id/cancel")
  async cancel(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const card = await prisma.virtualCard.findUnique({ where: { id } });
    if (!card) throw new Error("Card not found");
    if (card.userId !== userId) throw new Error("Not your card");
    if (card.status === "canceled") throw new Error("Card already canceled");

    await prisma.virtualCard.update({
      where: { id },
      data: { status: "canceled" },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "virtual_card_canceled",
      referenceId: id,
    });

    return { ok: true, status: "canceled" };
  }
}
