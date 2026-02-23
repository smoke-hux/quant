import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, scheduleSchema } from "@/lib/validations";

export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async () => {
    const schedules = await prisma.workSchedule.findMany({
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(schedules);
  }
);

export const PUT = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(scheduleSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { schedules } = parsed.data;

    const results = [];
    for (const schedule of schedules) {
      const result = await prisma.workSchedule.upsert({
        where: { dayOfWeek: schedule.dayOfWeek },
        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: schedule.isActive,
        },
        create: {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: schedule.isActive,
          createdBy: session.user.id,
        },
      });
      results.push(result);
    }

    return NextResponse.json(results);
  }
);
