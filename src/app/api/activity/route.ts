import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, activityLogSchema } from "@/lib/validations";

const VALID_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "FILE_UPLOAD",
  "FILE_EDIT",
  "FILE_DOWNLOAD",
];

export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(
      1,
      Math.min(parseInt(searchParams.get("limit") || "100") || 100, 500)
    );
    const offset = Math.max(
      0,
      parseInt(searchParams.get("offset") || "0") || 0
    );
    const action = searchParams.get("action");

    // Validate action filter against allowed enum values
    const where =
      action && VALID_ACTIONS.includes(action) ? { action } : {};

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
  }
);

export const POST = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(activityLogSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { action, details } = parsed.data;

    const sanitizedDetails = details
      ? String(details).slice(0, 500)
      : undefined;

    const log = await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action,
        details: sanitizedDetails,
      },
    });

    return NextResponse.json(log);
  }
);
