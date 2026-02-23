import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, safeJson } from "@/lib/api-utils";
import { validate, signupSchema } from "@/lib/validations";

export const POST = withAuth(
  { auth: "public", rateLimit: "auth" },
  async (req) => {
    const jsonResult = await safeJson(req);
    if ("error" in jsonResult) return jsonResult.error;

    const parsed = validate(signupSchema, jsonResult.data);
    if ("error" in parsed) return parsed.error;
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          error:
            "Unable to create account. Please try again or use a different email.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json({ success: true });
  }
);
