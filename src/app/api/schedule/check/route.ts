import { checkSchedule } from "@/lib/schedule-utils";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  { auth: "public", rateLimit: "api" },
  async (_req, { session }) => {
    if (!session) {
      return NextResponse.json({ allowed: false });
    }

    const scheduleInfo = await checkSchedule();

    const isAdmin = session.user.role === "ADMIN";

    // Check for admin-granted schedule override
    let hasOverride = false;
    let overrideUntil: string | null = null;

    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { scheduleOverrideUntil: true },
      });

      if (user?.scheduleOverrideUntil && user.scheduleOverrideUntil > new Date()) {
        hasOverride = true;
        overrideUntil = user.scheduleOverrideUntil.toISOString();
      }
    }

    const allowed = isAdmin || scheduleInfo.isWithinSchedule || hasOverride;

    return NextResponse.json({
      allowed,
      isAdmin,
      hasOverride,
      overrideUntil,
      ...scheduleInfo,
    });
  }
);
