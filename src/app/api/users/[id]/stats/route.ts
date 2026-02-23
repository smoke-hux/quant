import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const MAX_SESSION_LOGS = 5000;

export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (_req, { params }) => {
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Bound the session log query to prevent DoS
    const sessionLogs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: { in: ["LOGIN", "LOGOUT"] },
      },
      orderBy: { timestamp: "asc" },
      take: MAX_SESSION_LOGS,
    });

    const sessions: { login: Date; logout: Date | null; duration: number }[] =
      [];
    let currentLogin: Date | null = null;

    for (const log of sessionLogs) {
      if (log.action === "LOGIN") {
        if (currentLogin) {
          sessions.push({
            login: currentLogin,
            logout: null,
            duration: TWO_HOURS_MS,
          });
        }
        currentLogin = log.timestamp;
      } else if (log.action === "LOGOUT" && currentLogin) {
        const duration = Math.min(
          log.timestamp.getTime() - currentLogin.getTime(),
          TWO_HOURS_MS
        );
        sessions.push({
          login: currentLogin,
          logout: log.timestamp,
          duration,
        });
        currentLogin = null;
      }
    }

    if (currentLogin) {
      const duration = Math.min(
        Date.now() - currentLogin.getTime(),
        TWO_HOURS_MS
      );
      sessions.push({
        login: currentLogin,
        logout: null,
        duration,
      });
    }

    const totalHours = parseFloat(
      (
        sessions.reduce((sum, s) => sum + s.duration, 0) /
        (1000 * 60 * 60)
      ).toFixed(1)
    );

    const fileActivity = await prisma.activityLog.findMany({
      where: {
        userId,
        action: { in: ["FILE_EDIT", "FILE_UPLOAD", "FILE_DOWNLOAD"] },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    const projectNames = Array.from(
      new Set(
        fileActivity
          .map((log) => log.details)
          .filter((d): d is string => !!d)
      )
    );

    return NextResponse.json({
      user,
      stats: {
        totalHours,
        totalSessions: sessions.length,
        filesWorkedOn: fileActivity.length,
        projectNames,
      },
      sessions: sessions
        .sort((a, b) => b.login.getTime() - a.login.getTime())
        .map((s) => ({
          login: s.login.toISOString(),
          logout: s.logout?.toISOString() || null,
          duration: s.duration,
        })),
      fileActivity: fileActivity.map((log) => ({
        action: log.action,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
      })),
    });
  }
);
