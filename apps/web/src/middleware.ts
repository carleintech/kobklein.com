import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-middleware";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_DASHBOARD } from "@/lib/types/roles";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback"];
const ONBOARDING_PATHS = ["/onboarding", "/choose-role"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * Role-based dashboard route protection.
 * All roles share /dashboard — only role-specific sub-routes are locked.
 */
const ROLE_PROTECTED_ROUTES: Partial<Record<UserRole, string>> = {
  // distributor-only routes
  distributor: "/distributor",
  // merchant-only routes
  merchant: "/merchant",
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareSupabase(request);
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (isPublicPath(pathname)) {
    // Still call getUser() to refresh the session cookies if present
    await supabase.auth.getUser();
    return response;
  }

  // Everything else requires a valid session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Onboarding Enforcement ───────────────────────────────────────

  const role = user.user_metadata?.role as UserRole | undefined;
  const hasBasicProfile =
    user.user_metadata?.first_name && user.user_metadata?.last_name;

  // Legacy users without role → force choose-role
  if (!role && !pathname.startsWith("/choose-role")) {
    return NextResponse.redirect(new URL("/choose-role", request.nextUrl.origin));
  }

  // Users with incomplete profile → force onboarding (unless already on onboarding path)
  if (role && !hasBasicProfile && !isOnboardingPath(pathname)) {
    return NextResponse.redirect(
      new URL(`/onboarding/${role}`, request.nextUrl.origin),
    );
  }

  // ─── Role-Based Route Protection ──────────────────────────────────

  if (role && hasBasicProfile) {
    // Check if user is accessing a role-specific sub-route they don't own
    for (const [allowedRole, protectedPath] of Object.entries(
      ROLE_PROTECTED_ROUTES,
    )) {
      if (pathname.startsWith(protectedPath) && role !== allowedRole) {
        // Send them to the unified dashboard instead
        return NextResponse.redirect(
          new URL("/dashboard", request.nextUrl.origin),
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, icons, manifest, sw, workbox (static assets)
     * - sitemap, robots (SEO files)
     * - images/*, video/* (media)
     * - api/kobklein/* (internal proxy to NestJS — must NOT be intercepted
     *   by auth middleware or it redirects fetch() calls to /login)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*\\.js|sitemap.xml|robots.txt|images/.*|video/.*|api/kobklein/.*).*)",
  ],
};
