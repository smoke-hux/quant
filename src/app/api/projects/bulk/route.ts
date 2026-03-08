import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, bulkProjectActionSchema } from "@/lib/validations";

export const POST = withAuth(
  { auth: "admin", rateLimit: "api" },
  async (req, { session }) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(bulkProjectActionSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { projectIds, action, status, assignedToId } = parsed.data;

    switch (action) {
      case "UPDATE_STATUS": {
        if (!status) {
          return NextResponse.json(
            { error: "Status is required for UPDATE_STATUS action" },
            { status: 400 }
          );
        }
        const result = await prisma.excelProject.updateMany({
          where: { id: { in: projectIds } },
          data: { status },
        });
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_STATUS_UPDATE",
            details: `Updated ${result.count} projects to ${status}`,
          },
        });
        return NextResponse.json({ success: true, count: result.count });
      }

      case "TRANSFER": {
        if (assignedToId === undefined) {
          return NextResponse.json(
            { error: "assignedToId is required for TRANSFER action" },
            { status: 400 }
          );
        }
        // Verify target user exists if not unassigning
        if (assignedToId) {
          const targetUser = await prisma.user.findUnique({
            where: { id: assignedToId },
          });
          if (!targetUser) {
            return NextResponse.json(
              { error: "Target user not found" },
              { status: 404 }
            );
          }
        }
        const result = await prisma.excelProject.updateMany({
          where: { id: { in: projectIds } },
          data: { assignedToId: assignedToId || null },
        });
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_TRANSFER",
            details: `Transferred ${result.count} projects to ${assignedToId || "unassigned"}`,
          },
        });
        return NextResponse.json({ success: true, count: result.count });
      }

      case "DELETE": {
        // Documents cascade via onDelete: Cascade in schema
        const result = await prisma.excelProject.deleteMany({
          where: { id: { in: projectIds } },
        });
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BULK_DELETE",
            details: `Deleted ${result.count} projects`,
          },
        });
        return NextResponse.json({ success: true, count: result.count });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  }
);
