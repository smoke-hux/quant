import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const IDLE_THRESHOLD_MS = 30 * 60 * 1000;

export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - TWO_HOURS_MS);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all data in parallel (single batch for maximum concurrency)
    const [users, todayLogs, recentLogs, activeProjects, pendingAccessRequests, sessionLogs, lastActivityLogs] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.activityLog.findMany({
        where: { timestamp: { gte: todayStart } },
        select: { userId: true, action: true },
      }),
      prisma.activityLog.findMany({
        where: {},
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
      prisma.excelProject.findMany({
        where: { status: "IN_PROGRESS" },
        select: {
          id: true,
          name: true,
          status: true,
          fileName: true,
          updatedAt: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.accessRequest.count({
        where: { status: "PENDING" },
      }),
      // Session logs for online detection (LOGIN/LOGOUT in last 2 hours)
      prisma.activityLog.findMany({
        where: {
          action: { in: ["LOGIN", "LOGOUT"] },
          timestamp: { gte: twoHoursAgo },
        },
        orderBy: { timestamp: "desc" },
        select: { userId: true, action: true, timestamp: true },
      }),
      // Last activity per user (any action in last 2 hours)
      prisma.activityLog.findMany({
        where: {
          timestamp: { gte: twoHoursAgo },
        },
        orderBy: { timestamp: "desc" },
        select: { userId: true, timestamp: true },
      }),
    ]);

    // Build per-user session/activity maps
    const lastLoginMap = new Map<string, Date>();
    const lastLogoutMap = new Map<string, Date>();
    const lastActivityMap = new Map<string, Date>();

    for (const log of sessionLogs) {
      if (log.action === "LOGIN" && !lastLoginMap.has(log.userId)) {
        lastLoginMap.set(log.userId, log.timestamp);
      }
      if (log.action === "LOGOUT" && !lastLogoutMap.has(log.userId)) {
        lastLogoutMap.set(log.userId, log.timestamp);
      }
    }

    for (const log of lastActivityLogs) {
      if (!lastActivityMap.has(log.userId)) {
        lastActivityMap.set(log.userId, log.timestamp);
      }
    }

    // Determine user statuses
    const idleThreshold = new Date(now.getTime() - IDLE_THRESHOLD_MS);

    const userStatuses = users.map((user) => {
      const lastLogin = lastLoginMap.get(user.id);
      const lastLogout = lastLogoutMap.get(user.id);
      const lastActivity = lastActivityMap.get(user.id) || null;

      let status: "online" | "idle" | "offline" = "offline";

      if (lastLogin) {
        const isLoggedIn = !lastLogout || lastLogin > lastLogout;
        if (isLoggedIn) {
          if (lastActivity && lastActivity > idleThreshold) {
            status = "online";
          } else {
            status = "idle";
          }
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status,
        lastActivity: lastActivity?.toISOString() || null,
      };
    });

    const onlineUsers = userStatuses
      .filter((u) => u.status === "online" || u.status === "idle")
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        lastActivity: u.lastActivity,
      }));

    // Today stats
    const distinctActiveUsers = new Set(todayLogs.map((l) => l.userId));
    const todayStats = {
      totalLogins: todayLogs.filter((l) => l.action === "LOGIN").length,
      activeUsers: distinctActiveUsers.size,
      filesEdited: todayLogs.filter((l) => l.action === "FILE_EDIT").length,
      filesUploaded: todayLogs.filter((l) => l.action === "FILE_UPLOAD")
        .length,
      filesDownloaded: todayLogs.filter(
        (l) => l.action === "FILE_DOWNLOAD"
      ).length,
    };

    // Recent activity feed
    const recentActivity = recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp.toISOString(),
      user: log.user,
    }));

    return NextResponse.json({
      onlineUsers,
      todayStats,
      recentActivity,
      activeProjects: activeProjects.map((p) => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
      })),
      userStatuses,
      pendingAccessRequests,
    });
  }
);
