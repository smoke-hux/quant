import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, safeJson } from "@/lib/api-utils";
import {
  accessRequestSchema,
  reviewAccessRequestSchema,
  validate,
} from "@/lib/validations";

// GET — admin: list all requests; user: check own pending request
export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session }) => {
    const isAdmin = session.user.role === "ADMIN";
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    if (isAdmin) {
      const where = statusFilter ? { status: statusFilter } : {};
      const requests = await prisma.accessRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(requests);
    }

    // Regular user: return their own pending request (if any)
    const pending = await prisma.accessRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ hasPending: !!pending });
  }
);

// POST — user: create an access request
export const POST = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session }) => {
    const parsed = await safeJson(req);
    if ("error" in parsed) return parsed.error;

    const result = validate(accessRequestSchema, parsed.data);
    if ("error" in result) return result.error;

    // Prevent duplicate pending requests
    const existing = await prisma.accessRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request" },
        { status: 409 }
      );
    }

    const request = await prisma.accessRequest.create({
      data: {
        userId: session.user.id,
        message: result.data.message || null,
      },
    });

    return NextResponse.json(request, { status: 201 });
  }
);

// PATCH — admin: approve or deny a request
export const PATCH = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const parsed = await safeJson(req);
    if ("error" in parsed) return parsed.error;

    const result = validate(reviewAccessRequestSchema, parsed.data);
    if ("error" in result) return result.error;

    const { requestId, action, overrideHours } = result.data;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request already reviewed" },
        { status: 400 }
      );
    }

    // Update request status
    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "DENIED",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      },
    });

    // If approved, set schedule override on the user
    if (action === "APPROVE") {
      const hours = overrideHours ?? 8;
      const overrideUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: accessRequest.userId },
        data: { scheduleOverrideUntil: overrideUntil },
      });

      return NextResponse.json({
        status: "APPROVED",
        overrideUntil: overrideUntil.toISOString(),
      });
    }

    return NextResponse.json({ status: "DENIED" });
  }
);
