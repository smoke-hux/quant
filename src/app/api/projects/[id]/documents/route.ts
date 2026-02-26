import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { validateDocumentFile, MAX_DOCS_PER_PROJECT } from "@/lib/file-validation";

export const POST = withAuth(
  { auth: "user", rateLimit: "api" },
  async (req, { session, params }) => {
    const { id } = await params;

    const project = await prisma.excelProject.findUnique({
      where: { id },
      select: { id: true, name: true, assignedToId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && project.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docCount = await prisma.projectDocument.count({ where: { projectId: id } });
    if (docCount >= MAX_DOCS_PER_PROJECT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_DOCS_PER_PROJECT} documents per project` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const validation = validateDocumentFile(file, buffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const document = await prisma.projectDocument.create({
      data: {
        projectId: id,
        fileName: file.name,
        fileType: validation.fileType,
        fileSize: file.size,
        fileData: buffer,
        uploadedById: session.user.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_UPLOAD",
        details: `Document upload: ${file.name} (project: ${project.name})`,
      },
    });

    return NextResponse.json({
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
    });
  }
);

export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session, params }) => {
    const { id } = await params;

    const project = await prisma.excelProject.findUnique({
      where: { id },
      select: { id: true, assignedToId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && project.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.projectDocument.findMany({
      where: { projectId: id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  }
);
