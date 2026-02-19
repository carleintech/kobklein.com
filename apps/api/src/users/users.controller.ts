import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("v1/users")
export class UsersController {
  /**
   * GET /v1/users/me
   * Returns the authenticated user's profile from the local database.
   * The SupabaseGuard verifies the JWT and syncs the user via auth-sync,
   * populating req.localUser with the full User row.
   */
  @UseGuards(SupabaseGuard)
  @Get("me")
  me(@Req() req: any) {
    const u = req.localUser;

    if (!u) {
      return {
        id: req.user?.sub ?? null,
        role: req.user?.user_metadata?.role ?? "user",
        firstName: null,
        lastName: null,
        email: req.user?.email ?? null,
        handle: null,
        kId: null,
        kycTier: 0,
        kycStatus: "none",
        phone: null,
        isFrozen: false,
        preferredLang: "en",
        createdAt: null,
      };
    }

    return {
      id: u.id,
      role: u.role,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: u.email ?? null,
      handle: u.handle ?? null,
      kId: u.kId ?? null,
      kycTier: u.kycTier ?? 0,
      kycStatus: u.kycStatus ?? "none",
      phone: u.phone ?? null,
      isFrozen: u.isFrozen ?? false,
      preferredLang: u.preferredLang ?? "en",
      createdAt: u.createdAt ?? null,
    };
  }
}
