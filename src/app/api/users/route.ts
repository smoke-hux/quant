import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, safeJson } from "@/lib/api-utils";
import {
  validate,
  createUserSchema,
  updateRoleSchema,
} from "@/lib/validations";

export const GET = withAuth(
  { auth: "admin", rateLimit: "api" },
  async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        activityLogs: {
          where: { action: "LOGIN" },
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { timestamp: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const usersWithLastLogin = users.map((user) => ({
      ...user,
      lastLogin: user.activityLogs[0]?.timestamp || null,
      activityLogs: undefined,
    }));

    return NextResponse.json(usersWithLastLogin);
  }
);

export const POST = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(createUserSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  }
);

export const PATCH = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(updateRoleSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { userId, role } = parsed.data;

    // Prevent admin from demoting themselves
    if (userId === session.user.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  }
);
