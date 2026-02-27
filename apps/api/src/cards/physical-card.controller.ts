/**
 * Physical Card Request Controller — KobKlein API
 *
 * POST /v1/cards/physical/request — submit physical card request
 * GET  /v1/cards/physical/status  — get current request status
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { notifyUser } from "../push/push.service";

interface RequestCardBody {
  cardholderName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

@Controller("v1/cards/physical")
@UseGuards(SupabaseGuard)
export class PhysicalCardController {
  @Get("status")
  async status(@Req() req: any) {
    const userId = req.localUser?.id;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    const request = await prisma.physicalCardRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        cardholderName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postalCode: true,
        country: true,
        trackingNum: true,
        rejectionNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return request ?? null;
  }

  @Post("request")
  async request(@Req() req: any, @Body() body: RequestCardBody) {
    const userId = req.localUser?.id;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    // KYC tier check — need at least tier 1
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycTier: true, firstName: true },
    });
    if (!user) throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    if (user.kycTier < 1) {
      throw new HttpException(
        "KYC verification required before requesting a physical card",
        HttpStatus.FORBIDDEN,
      );
    }

    // Only one active (non-rejected) request allowed at a time
    const existing = await prisma.physicalCardRequest.findFirst({
      where: {
        userId,
        status: { notIn: ["rejected", "delivered"] },
      },
    });
    if (existing) {
      throw new HttpException(
        `You already have a ${existing.status} physical card request`,
        HttpStatus.CONFLICT,
      );
    }

    // Validate required fields
    if (!body.cardholderName?.trim()) throw new HttpException("cardholderName is required", HttpStatus.BAD_REQUEST);
    if (!body.addressLine1?.trim()) throw new HttpException("addressLine1 is required", HttpStatus.BAD_REQUEST);
    if (!body.city?.trim()) throw new HttpException("city is required", HttpStatus.BAD_REQUEST);

    const record = await prisma.physicalCardRequest.create({
      data: {
        userId,
        cardholderName: body.cardholderName.trim(),
        addressLine1: body.addressLine1.trim(),
        addressLine2: body.addressLine2?.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode?.trim(),
        country: body.country?.trim() ?? "HT",
      },
    });

    // Notify user
    notifyUser(userId, {
      title: "Physical Card Requested",
      body: "Your KobKlein physical card request has been received. We'll notify you when it ships.",
      data: { type: "physical_card_request", requestId: record.id },
    }).catch(() => {});

    return {
      id: record.id,
      status: record.status,
      message: "Physical card request submitted successfully",
    };
  }
}
