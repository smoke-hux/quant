import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js-specific imports like bcrypt/prisma)
// Only contains config that is safe to run in Edge Runtime (middleware)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — always allow
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/unavailable" ||
        pathname.startsWith("/api/auth") ||
        pathname === "/api/schedule/check" ||
        pathname === "/api/session/check"
      ) {
        return true;
      }

      // Not authenticated → middleware will redirect to signIn page
      if (!isLoggedIn) {
        return false;
      }

      // Admin routes require ADMIN role
      if (pathname.startsWith("/admin") && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/user/projects", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Added in auth.ts (server-only)
} satisfies NextAuthConfig;
