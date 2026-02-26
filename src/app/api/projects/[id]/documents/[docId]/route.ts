import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";

export const GET = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session, params }) => {
    const { id, docId } = await params;

    const document = await prisma.projectDocument.findUnique({
      where: { id: docId },
      include: {
        project: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!document || document.projectId !== id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && document.project.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_DOWNLOAD",
        details: `Document download: ${document.fileName} (project: ${document.project.name})`,
      },
    });

    const fileDataBase64 = Buffer.from(document.fileData).toString("base64");

    return NextResponse.json({
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      fileData: fileDataBase64,
    });
  }
);

export const DELETE = withAuth(
  { auth: "user", rateLimit: "api" },
  async (_req, { session, params }) => {
    const { id, docId } = await params;

    const document = await prisma.projectDocument.findUnique({
      where: { id: docId },
      include: {
        project: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!document || document.projectId !== id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.projectDocument.delete({ where: { id: docId } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FILE_UPLOAD",
        details: `Document deleted: ${document.fileName} (project: ${document.project.name})`,
      },
    });

    return NextResponse.json({ success: true });
  }
);
