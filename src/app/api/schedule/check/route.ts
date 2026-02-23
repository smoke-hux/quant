import { checkSchedule } from "@/lib/schedule-utils";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

export const GET = withAuth(
  { auth: "public", rateLimit: "api" },
  async (_req, { session }) => {
    if (!session) {
      return NextResponse.json({ allowed: false });
    }

    const scheduleInfo = await checkSchedule();

    const isAdmin = session.user.role === "ADMIN";
    const allowed = isAdmin || scheduleInfo.isWithinSchedule;

    return NextResponse.json({
      allowed,
      isAdmin,
      ...scheduleInfo,
    });
  }
);
