import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware does basic route protection via session cookie check.
// Full validation (role, expiry, revocation) happens server-side in auth() / withAuth().

const PUBLIC_ROUTES = new Set(["/", "/login", "/unavailable"]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/api/schedule/check") return true;
  if (pathname === "/api/session/check") return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.session-token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — allow through. Server-side auth() handles full validation.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
