import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { createReceiveCode, resolveReceiveCode } from "./receive-code.service";
import { computeTrustScore } from "../risk/trust-score.service";

@Controller("v1/users")
export class ReceiveQRController {
  /**
   * Get the user's static QR payload for receiving money.
   */
  @UseGuards(Auth0Guard)
  @Get("me/receive-code")
  async receiveCode(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    });

    const qrPayload = user?.handle
      ? `kobklein://pay?handle=${user.handle}`
      : `kobklein://pay?uid=${userId}`;

    return { userId, qrPayload, handle: user?.handle };
  }

  /**
   * Get a rotating 6-digit receive code (5-minute expiry).
   * Used for street/voice/offline transactions.
   */
  @UseGuards(Auth0Guard)
  @Get("me/receive-code/rotating")
  async rotatingCode(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    return createReceiveCode(userId);
  }

  /**
   * Resolve a receive code to a recipient.
   */
  @UseGuards(Auth0Guard)
  @Post("receive-code/resolve")
  async resolve(@Body() body: { code: string }) {
    const result = await resolveReceiveCode(body.code);

    // Enrich with trust score and display name
    const user = await prisma.user.findUnique({
      where: { id: result.recipientUserId },
      select: { firstName: true, lastName: true, handle: true },
    });

    const trust = await computeTrustScore(result.recipientUserId);

    return {
      ...result,
      displayName: user?.firstName || user?.handle || "User",
      trust,
    };
  }

  /**
   * Resolve a handle to a public profile (no auth required).
   */
  @Get("public/pay/:handle")
  async publicProfile(@Req() req: any) {
    const handle = req.params.handle;

    const user = await prisma.user.findFirst({
      where: { handle },
      select: { id: true, firstName: true, handle: true, isFrozen: true },
    });

    if (!user) throw new Error("User not found");
    if (user.isFrozen) throw new Error("Account unavailable");

    const trust = await computeTrustScore(user.id);

    return {
      userId: user.id,
      displayName: user.firstName || user.handle,
      handle: user.handle,
      trust: { level: trust.level },
    };
  }
}
