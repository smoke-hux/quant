import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, putProjectSchema } from "@/lib/validations";

export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session, params }) => {
    const { id } = await params;
    const project = await prisma.excelProject.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      project.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileDataBase64 = Buffer.from(project.fileData).toString("base64");

    return NextResponse.json({
      ...project,
      fileData: fileDataBase64,
    });
  }
);

export const PUT = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session, params }) => {
    const { id } = await params;
    const project = await prisma.excelProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      project.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(putProjectSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { fileData, status } = parsed.data;

    const data: Record<string, unknown> = {};
    if (fileData) {
      data.fileData = Buffer.from(fileData, "base64");
    }
    if (status) {
      data.status = status;
    }

    await prisma.excelProject.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_EDIT",
        details: `Edited project: ${project.name}`,
      },
    });

    return NextResponse.json({ success: true });
  }
);

export const PATCH = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session, params }) => {
    const { id } = await params;
    const project = await prisma.excelProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Authorization check — users can only log downloads for their own projects
    if (
      session.user.role !== "ADMIN" &&
      project.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_DOWNLOAD",
        details: `Downloaded project: ${project.name}`,
      },
    });

    return NextResponse.json({ success: true });
  }
);
