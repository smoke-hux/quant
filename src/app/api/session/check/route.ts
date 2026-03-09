import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

export const GET = withAuth(
  { auth: "public", rateLimit: "api" },
  async (_req, { session }) => {
    if (!session) {
      return NextResponse.json({ valid: false, reason: "not_authenticated" });
    }

    // Session expired or revoked (caught by jwt callback's DB check)
    if (session.sessionExpired) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentLogout = await prisma.activityLog.findFirst({
        where: {
          userId: session.user.id,
          action: "LOGOUT",
          timestamp: { gte: fiveMinAgo },
        },
        orderBy: { timestamp: "desc" },
      });

      if (!recentLogout) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "LOGOUT",
            details: "Session expired or revoked",
          },
        });
      }

      return NextResponse.json({ valid: false, reason: "session_expired" });
    }

    return NextResponse.json({
      valid: true,
      expiresAt: session.expiresAt,
      role: session.user.role,
    });
  }
);
