import { canAccess, type AdminRole } from "@/lib/admin-role";
import { createMiddlewareClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set([
  "admin",
  "super_admin",
  "regional_manager",
  "support_agent",
  "compliance_officer",
  "treasury_officer",
  "hr_manager",
  "investor",
  "auditor",
  "broadcaster",
]);

const VALID_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "regional_manager",
  "support_agent",
  "compliance_officer",
  "treasury_officer",
  "hr_manager",
  "investor",
  "auditor",
  "broadcaster",
];

// Paths that never require authentication
const PUBLIC_PREFIXES = ["/auth/", "/portal"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through static assets immediately
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|gif|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient(request, res);

  // Refresh the session — MUST be called to keep session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Public paths — no auth needed ──────────────────────────────────────
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic || pathname === "/not-authorized") {
    // If already authenticated, redirect away from login to dashboard
    if (user && (pathname === "/auth/login" || pathname === "/portal")) {
      return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }
    return res;
  }

  // ── Require authentication ─────────────────────────────────────────────
  if (!user) {
    // Root "/" is the public welcome/landing page — let unauthenticated users see it
    if (pathname === "/") return res;

    return NextResponse.redirect(
      new URL("/auth/login", request.nextUrl.origin),
    );
  }

  // ── Require admin role ─────────────────────────────────────────────────
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const rawRole =
    (meta?.["admin_role"] as string | undefined) ??
    (meta?.["role"] as string | undefined) ??
    undefined;

  if (!rawRole || !ADMIN_ROLES.has(rawRole)) {
    return NextResponse.redirect(
      new URL("/not-authorized", request.nextUrl.origin),
    );
  }

  // ── Page-level ACL for sub-roles ───────────────────────────────────────
  const adminRole: AdminRole = VALID_ROLES.includes(rawRole as AdminRole)
    ? (rawRole as AdminRole)
    : "admin";

  if (adminRole !== "super_admin" && adminRole !== "admin") {
    if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
      if (!canAccess(adminRole, pathname)) {
        return NextResponse.redirect(
          new URL("/not-authorized", request.nextUrl.origin),
        );
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
