import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import {
  validate,
  grantTempAdminSchema,
  revokeTempAdminSchema,
} from "@/lib/validations";

// POST — Grant temporary admin privileges
export const POST = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(grantTempAdminSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { userId, hours } = parsed.data;

    // Cannot grant temp admin to yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot grant temp admin to yourself" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, tempAdminUntil: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Don't grant to a permanent admin (no tempAdminUntil)
    if (targetUser.role === "ADMIN" && !targetUser.tempAdminUntil) {
      return NextResponse.json(
        { error: "User is already a permanent admin" },
        { status: 400 }
      );
    }

    const tempAdminUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN", tempAdminUntil },
      select: { id: true, name: true, email: true, role: true, tempAdminUntil: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "TEMP_ADMIN_GRANTED",
        details: `Granted temp admin to ${user.email} for ${hours}h`,
      },
    });

    return NextResponse.json(user);
  }
);

// DELETE — Revoke temporary admin privileges
export const DELETE = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(revokeTempAdminSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { userId } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, tempAdminUntil: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!targetUser.tempAdminUntil) {
      return NextResponse.json(
        { error: "User does not have temporary admin privileges" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: "USER", tempAdminUntil: null },
      select: { id: true, name: true, email: true, role: true, tempAdminUntil: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "TEMP_ADMIN_REVOKED",
        details: `Revoked temp admin from ${targetUser.email}`,
      },
    });

    return NextResponse.json(user);
  }
);
