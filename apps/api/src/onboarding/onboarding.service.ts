/**
 * Onboarding Service
 *
 * Business logic for completing role-specific onboarding flows.
 * Each method handles the unique requirements for client, diaspora, merchant, or distributor roles.
 */

import { Injectable, BadRequestException } from "@nestjs/common";
import { prisma } from "../db/prisma";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import type {
  ClientOnboardingDto,
  DiasporaOnboardingDto,
  MerchantOnboardingDto,
  DistributorOnboardingDto,
} from "../validation/onboarding.dto";

@Injectable()
export class OnboardingService {
  /**
   * Complete Client Onboarding
   * Creates basic profile with light KYC requirements
   */
  async completeClientOnboarding(userId: string, dto: ClientOnboardingDto) {
    // Check if handle is already taken
    const existing = await prisma.user.findUnique({
      where: { handle: dto.handle },
    });

    if (existing && existing.id !== userId) {
      throw new BadRequestException("Handle already taken");
    }

    // Hash transaction PIN
    const hashedPin = await bcrypt.hash(dto.transactionPin, 10);

    // Update user record
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        handle: dto.handle,
        dateOfBirth: new Date(dto.dateOfBirth),
        country: dto.country,
        role: "client",
        profileComplete: true,
        onboardingComplete: true,
        transactionPinHash: hashedPin,
      },
    });

    return {
      success: true,
      role: "client",
      user: {
        id: user.id,
        handle: user.handle,
        role: user.role,
      },
    };
  }

  /**
   * Complete Diaspora Onboarding
   * Creates enhanced KYC profile with remittance details
   */
  async completeDiasporaOnboarding(userId: string, dto: DiasporaOnboardingDto) {
    // Check if handle is already taken
    const existing = await prisma.user.findUnique({
      where: { handle: dto.handle },
    });

    if (existing && existing.id !== userId) {
      throw new BadRequestException("Handle already taken");
    }

    // Hash transaction PIN
    const hashedPin = await bcrypt.hash(dto.transactionPin, 10);

    // Update user record and create diaspora profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          handle: dto.handle,
          dateOfBirth: new Date(dto.dateOfBirth),
          country: "HT", // Diaspora users send TO Haiti, but live elsewhere
          role: "diaspora",
          profileComplete: true,
          onboardingComplete: true,
          transactionPinHash: hashedPin,
        },
      });

      // Create DiasporaProfile record
      const diasporaProfile = await tx.diasporaProfile.create({
        data: {
          userId,
          countryOfResidence: dto.countryOfResidence,
          city: dto.city || null,
          stateProvince: dto.stateProvince || null,
          postalCode: dto.postalCode || null,
          taxResidence: dto.taxResidence || null,
          remittancePurpose: dto.remittancePurpose || null,
          estimatedMonthly: dto.estimatedMonthly || null,
          preferredCurrency: dto.preferredCurrency || "USD",
        },
      });

      return { user, diasporaProfile };
    });

    return {
      success: true,
      role: "diaspora",
      user: {
        id: result.user.id,
        handle: result.user.handle,
        role: result.user.role,
      },
    };
  }

  /**
   * Complete Merchant Onboarding
   * Creates business profile (status=pending, requires admin approval)
   */
  async completeMerchantOnboarding(userId: string, dto: MerchantOnboardingDto) {
    // Hash transaction PIN
    const hashedPin = await bcrypt.hash(dto.transactionPin, 10);

    // Generate unique payment code (6-digit alphanumeric)
    const paymentCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Update user and create merchant record in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: "merchant",
          profileComplete: true,
          onboardingComplete: true,
          transactionPinHash: hashedPin,
        },
      });

      // Create Merchant record
      const merchant = await tx.merchant.create({
        data: {
          userId,
          businessName: dto.businessName,
          phone: dto.phone || null,
          category: dto.category || "other",
          paymentCode,
          kycStatus: "pending",
          status: "pending", // Requires admin approval
        },
      });

      return { user, merchant };
    });

    return {
      success: true,
      role: "merchant",
      status: "pending",
      message: "Your merchant application is under review. You'll be notified when approved.",
      user: {
        id: result.user.id,
        role: result.user.role,
      },
      merchant: {
        businessName: result.merchant.businessName,
        paymentCode: result.merchant.paymentCode,
        status: result.merchant.status,
      },
    };
  }

  /**
   * Complete Distributor Onboarding
   * Creates cash agent profile (status=pending, requires admin approval + EDD)
   */
  async completeDistributorOnboarding(userId: string, dto: DistributorOnboardingDto) {
    // Hash transaction PIN
    const hashedPin = await bcrypt.hash(dto.transactionPin, 10);

    // Update user and create distributor record in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: "distributor",
          profileComplete: true,
          onboardingComplete: true,
          transactionPinHash: hashedPin,
        },
      });

      // Create Distributor record
      const distributor = await tx.distributor.create({
        data: {
          userId,
          businessName: dto.businessName,
          phonePublic: dto.phonePublic,
          locationText: dto.locationText,
          status: "pending", // Requires admin approval + enhanced due diligence
          // TODO: Store coverageArea and compliance agreements in metadata
        },
      });

      return { user, distributor };
    });

    return {
      success: true,
      role: "distributor",
      status: "pending",
      message: "Your cash agent application is under review. Enhanced due diligence is required.",
      user: {
        id: result.user.id,
        role: result.user.role,
      },
      distributor: {
        businessName: result.distributor.businessName,
        status: result.distributor.status,
      },
    };
  }
}
