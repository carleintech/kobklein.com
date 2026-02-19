/**
 * Onboarding Controller
 *
 * API endpoints for completing role-specific onboarding.
 * Protected by SupabaseGuard - requires valid JWT token.
 *
 * Endpoints:
 * - POST /v1/onboarding/client - Complete client onboarding
 * - POST /v1/onboarding/diaspora - Complete diaspora onboarding
 * - POST /v1/onboarding/merchant - Complete merchant onboarding (pending approval)
 * - POST /v1/onboarding/distributor - Complete distributor onboarding (pending approval)
 */

import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import {
  ClientOnboardingDto,
  DiasporaOnboardingDto,
  MerchantOnboardingDto,
  DistributorOnboardingDto,
} from "../validation/onboarding.dto";
import { OnboardingService } from "./onboarding.service";

@Controller("v1/onboarding")
@UseGuards(SupabaseGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post("client")
  async client(@Req() req: any, @Body() dto: ClientOnboardingDto) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.onboardingService.completeClientOnboarding(userId, dto);
  }

  @Post("diaspora")
  async diaspora(@Req() req: any, @Body() dto: DiasporaOnboardingDto) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.onboardingService.completeDiasporaOnboarding(userId, dto);
  }

  @Post("merchant")
  async merchant(@Req() req: any, @Body() dto: MerchantOnboardingDto) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.onboardingService.completeMerchantOnboarding(userId, dto);
  }

  @Post("distributor")
  async distributor(@Req() req: any, @Body() dto: DistributorOnboardingDto) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.onboardingService.completeDistributorOnboarding(userId, dto);
  }
}
