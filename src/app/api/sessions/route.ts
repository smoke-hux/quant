import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";

// GET /api/sessions — List active sessions (admin only)
export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (_req, { session }) => {
    const sessions = await prisma.session.findMany({
      where: {
        expires: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        userId: s.userId,
        user: s.user,
        createdAt: s.createdAt.toISOString(),
        expires: s.expires.toISOString(),
      }))
    );
  }
);

// DELETE /api/sessions — Revoke a user's sessions (admin only)
export const DELETE = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const result = await safeJson(req);
    if ("error" in result) return result.error;

    const { userId } = result.data;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Prevent admin from revoking their own session
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot revoke your own session" },
        { status: 400 }
      );
    }

    const deleted = await prisma.session.deleteMany({
      where: { userId },
    });

    if (deleted.count > 0) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: "LOGOUT",
          details: `Session revoked by admin (${session.user.email})`,
        },
      });
    }

    return NextResponse.json({
      revoked: deleted.count,
      message: `Revoked ${deleted.count} session(s)`,
    });
  }
);
