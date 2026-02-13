import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  // Let the Auth0 SDK handle /auth/* routes (login, callback, logout, etc.)
  const authRes = await auth0.middleware(request);

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  // Allow the not-authorized page to render without a role check
  if (request.nextUrl.pathname === "/not-authorized") {
    return authRes;
  }

  // Require login for everything else
  const session = await auth0.getSession(request);

  if (!session) {
    return NextResponse.redirect(
      new URL("/auth/login", request.nextUrl.origin),
    );
  }

  // Enforce admin role from Auth0 custom claim
  const role =
    (session.user as Record<string, unknown>)["https://kobklein.com/role"] ??
    (session.user as Record<string, unknown>)["role"];

  if (role !== "admin") {
    return NextResponse.redirect(
      new URL("/not-authorized", request.nextUrl.origin),
    );
  }

  // Return auth response (carries session cookies, rolling session extension, etc.)
  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
