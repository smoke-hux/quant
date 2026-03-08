import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      select: { action: true, timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    // Group by day
    const dayMap = new Map<string, { logins: number; edits: number; uploads: number; downloads: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { logins: 0, edits: 0, uploads: 0, downloads: 0 });
    }

    for (const log of logs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      if (log.action === "LOGIN") bucket.logins++;
      else if (log.action === "FILE_EDIT") bucket.edits++;
      else if (log.action === "FILE_UPLOAD") bucket.uploads++;
      else if (log.action === "FILE_DOWNLOAD") bucket.downloads++;
    }

    const days = Array.from(dayMap.keys());
    const data = Array.from(dayMap.values());

    return NextResponse.json({
      days,
      logins: data.map((d) => d.logins),
      edits: data.map((d) => d.edits),
      uploads: data.map((d) => d.uploads),
      downloads: data.map((d) => d.downloads),
    });
  }
);
