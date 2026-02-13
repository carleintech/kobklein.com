import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { signPosRequest } from "../utils/qr-signature";

/**
 * Merchant POS Request Controller
 *
 * Lets a merchant create a payment request that encodes into a QR code.
 * The customer scans the QR and pays via pay-pos.controller.ts.
 */
@Controller("v1/merchant/pos")
export class MerchantPosRequestController {
  /**
   * POST /v1/merchant/pos/create
   *
   * Merchant creates a POS payment request.
   * Returns the request ID + HMAC signature for QR encoding.
   *
   * Body: { amount: number, currency?: string, note?: string, ttlMinutes?: number }
   */
  @UseGuards(Auth0Guard)
  @Post("create")
  async createRequest(
    @Req() req: any,
    @Body()
    body: {
      amount: number;
      currency?: string;
      note?: string;
      ttlMinutes?: number;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Look up merchant record for this user
    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) throw new Error("Merchant not found");
    if (merchant.status !== "active") throw new Error("Merchant account is not active");

    const amount = body.amount;
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const currency = body.currency || "HTG";
    const ttlMinutes = body.ttlMinutes || 15; // default 15 min expiry

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    // Create the POS request record
    const posRequest = await prisma.merchantPosRequest.create({
      data: {
        merchantId: merchant.id,
        amount,
        currency,
        note: body.note || null,
        status: "pending",
        signature: "", // placeholder — we sign after we have the ID
        expiresAt,
      },
    });

    // Sign the request with HMAC
    const signature = signPosRequest({
      requestId: posRequest.id,
      merchantId: merchant.id,
      amount: String(amount),
      currency,
    });

    // Store the signature
    await prisma.merchantPosRequest.update({
      where: { id: posRequest.id },
      data: { signature },
    });

    // Return QR payload — the client app encodes this into a QR code
    return {
      ok: true,
      qrPayload: {
        requestId: posRequest.id,
        merchantId: merchant.id,
        merchantName: merchant.businessName,
        amount,
        currency,
        note: body.note || null,
        signature,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  /**
   * GET /v1/merchant/pos/:id
   *
   * Check the status of a POS request (for polling by the merchant).
   */
  @UseGuards(Auth0Guard)
  @Get(":id")
  async getRequestStatus(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) throw new Error("Merchant not found");

    const posRequest = await prisma.merchantPosRequest.findUnique({
      where: { id },
    });

    if (!posRequest || posRequest.merchantId !== merchant.id) {
      throw new Error("Request not found");
    }

    // Check if expired and still pending
    if (posRequest.status === "pending" && new Date() > posRequest.expiresAt) {
      await prisma.merchantPosRequest.update({
        where: { id },
        data: { status: "expired" },
      });

      return { ok: true, status: "expired" };
    }

    return {
      ok: true,
      status: posRequest.status,
      amount: posRequest.amount,
      currency: posRequest.currency,
      paidByUserId: posRequest.paidByUserId,
      paidAt: posRequest.paidAt,
      createdAt: posRequest.createdAt,
    };
  }

  /**
   * POST /v1/merchant/pos/:id/cancel
   *
   * Merchant cancels a pending POS request.
   */
  @UseGuards(Auth0Guard)
  @Post(":id/cancel")
  async cancelRequest(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) throw new Error("Merchant not found");

    const posRequest = await prisma.merchantPosRequest.findUnique({
      where: { id },
    });

    if (!posRequest || posRequest.merchantId !== merchant.id) {
      throw new Error("Request not found");
    }

    if (posRequest.status !== "pending") {
      throw new Error("Only pending requests can be canceled");
    }

    await prisma.merchantPosRequest.update({
      where: { id },
      data: { status: "canceled" },
    });

    return { ok: true };
  }
}
