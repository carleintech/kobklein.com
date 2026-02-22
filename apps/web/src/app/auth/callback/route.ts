import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_DASHBOARD } from "@/lib/types/roles";

/**
 * Auth callback — Supabase redirects here after email confirmation.
 * Exchanges the auth code for a session, then redirects based on onboarding status:
 * - New users (no profile) → /onboarding/{role}
 * - Existing users (profile incomplete) → /onboarding/{role}
 * - Completed onboarding → role-specific dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Supabase sends error params when the link is invalid or expired
  const errorCode = searchParams.get("error_code");
  if (errorCode === "otp_expired") {
    return NextResponse.redirect(`${origin}/login?notice=link_expired`);
  }
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?notice=link_invalid`);
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user data to check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = user.user_metadata?.role as UserRole | undefined;
        const hasBasicProfile =
          user.user_metadata?.first_name && user.user_metadata?.last_name;

        // Legacy users without a role → choose-role flow
        if (!role) {
          return NextResponse.redirect(`${origin}/choose-role`);
        }

        // New users or users with incomplete profile → onboarding wizard
        if (!hasBasicProfile) {
          return NextResponse.redirect(`${origin}/onboarding/${role}`);
        }

        // If user provided a specific redirect, honor it
        if (next) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // Otherwise, redirect to role-appropriate dashboard
        const dashboard = ROLE_DASHBOARD[role] || "/dashboard";
        return NextResponse.redirect(`${origin}${dashboard}`);
      }

      // Email confirmed — redirect to login with success notice
      return NextResponse.redirect(`${origin}/login?notice=confirmed`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?notice=link_invalid`);
}
