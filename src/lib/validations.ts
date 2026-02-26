import { z } from "zod";
import { NextResponse } from "next/server";

export const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
});

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  assignedToId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

// LOGIN is system-only (logged in signIn callback); LOGOUT is user-initiated (sign-out button)
export const activityLogSchema = z.object({
  action: z.enum(["LOGOUT", "FILE_UPLOAD", "FILE_EDIT", "FILE_DOWNLOAD"]),
  details: z.string().max(500).optional(),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(timeRegex, "Must be HH:mm format"),
      endTime: z.string().regex(timeRegex, "Must be HH:mm format"),
      isActive: z.boolean(),
    })
  ),
});

// Validation schema for PUT /api/projects/[id] (file data updates)
const MAX_BASE64_SIZE = 70_000_000; // ~50MB in base64
export const putProjectSchema = z.object({
  fileData: z.string().max(MAX_BASE64_SIZE, "File data too large").optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export const accessRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export const reviewAccessRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["APPROVE", "DENY"]),
  overrideHours: z.number().min(1).max(72).optional(),
});

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
