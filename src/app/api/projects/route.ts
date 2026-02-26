import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, updateProjectSchema } from "@/lib/validations";

export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session }) => {
    const where =
      session.user.role === "ADMIN" ? {} : { assignedToId: session.user.id };

    const projects = await prisma.excelProject.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedToId: true,
        createdById: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  }
);

// POST upload a new project (admin only) — file upload, keep manual validation
export const POST = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const assignedToId = formData.get("assignedToId") as string | null;
    const file = formData.get("file") as File;

    if (!name || name.length > 255) {
      return NextResponse.json(
        { error: "Name is required and must be under 255 characters" },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        { error: "Description must be under 2000 characters" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must not exceed 50MB" },
        { status: 400 }
      );
    }

    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Only .xlsx, .xls, and .csv files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file magic bytes to prevent extension spoofing
    const isXlsx =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04; // ZIP/XLSX signature
    const isXls =
      buffer.length >= 4 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0; // OLE2/XLS signature
    const isCsv = fileExtension === ".csv"; // CSV has no magic bytes — text format

    if (!isXlsx && !isXls && !isCsv) {
      return NextResponse.json(
        { error: "File content does not match the expected format" },
        { status: 400 }
      );
    }

    // Validate assignedToId references an existing user
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: "Assigned user not found" },
          { status: 400 }
        );
      }
    }

    const project = await prisma.excelProject.create({
      data: {
        name,
        description: description || null,
        fileName: file.name,
        fileData: buffer,
        assignedToId: assignedToId || null,
        createdById: session.user.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_UPLOAD",
        details: `Uploaded project: ${name}`,
      },
    });

    return NextResponse.json({ id: project.id, name: project.name });
  }
);

export const PATCH = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(updateProjectSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { projectId, assignedToId, status } = parsed.data;

    // Only admin can assign users
    if (assignedToId !== undefined && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Non-admin users can only update status on their own assigned projects
    if (session.user.role !== "ADMIN") {
      const project = await prisma.excelProject.findUnique({
        where: { id: projectId },
        select: { assignedToId: true },
      });
      if (!project || project.assignedToId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const data: Record<string, unknown> = {};
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (status) data.status = status;

    const project = await prisma.excelProject.update({
      where: { id: projectId },
      data,
    });

    return NextResponse.json({ id: project.id, status: project.status });
  }
);
