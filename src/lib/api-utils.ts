import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, authLimiter, apiLimiter } from "@/lib/rate-limit";
import type { Session } from "next-auth";

type HandlerConfig = {
  auth?: "admin" | "user" | "public";
  rateLimit?: { limit: number; windowMs: number } | "auth" | "api";
};

type AuthenticatedRequest = {
  session: Session;
};

export async function safeJson(req: Request): Promise<{ data: any } | { error: NextResponse }> {
  try {
    const data = await req.json();
    return { data };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or missing JSON body" },
        { status: 400 }
      ),
    };
  }
}

export function withAuth(
  config: HandlerConfig,
  handler: (
    req: Request,
    ctx: AuthenticatedRequest & { params?: any }
  ) => Promise<NextResponse>
): (req: Request, ctx?: any) => Promise<NextResponse> {
  const authLevel = config.auth ?? "user";

  return async (req: Request, ctx?: any) => {
    // 1. Rate limiting — use x-forwarded-for only when behind a proxy,
    //    fallback to a shared bucket instead of trusting client headers blindly.
    //    The rightmost x-forwarded-for entry before our proxy is more trustworthy
    //    than the leftmost (which is client-supplied).
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
      req.headers.get("x-real-ip") ||
      (forwardedFor ? forwardedFor.split(",").pop()!.trim() : null) ||
      "shared";

    if (config.rateLimit) {
      let result: { allowed: boolean; remaining: number };
      if (config.rateLimit === "auth") {
        result = authLimiter(ip);
      } else if (config.rateLimit === "api") {
        result = apiLimiter(ip);
      } else {
        result = rateLimit(`custom:${ip}`, config.rateLimit);
      }
      if (!result.allowed) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }
    }

    // 2. CSRF check for state-changing methods
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const origin = req.headers.get("origin");
      const allowedUrl = process.env.NEXTAUTH_URL || "";
      const isDev = process.env.NODE_ENV === "development";

      if (origin) {
        let originHost: string;
        try {
          originHost = new URL(origin).host;
        } catch {
          return NextResponse.json(
            { error: "CSRF check failed" },
            { status: 403 }
          );
        }

        const isLocalhost =
          originHost.startsWith("localhost") ||
          originHost.startsWith("127.0.0.1");

        let valid = false;
        if (isDev && isLocalhost) {
          valid = true;
        } else if (allowedUrl) {
          try {
            valid = new URL(allowedUrl).host === originHost;
          } catch {
            valid = false;
          }
        }

        if (!valid) {
          return NextResponse.json(
            { error: "CSRF check failed" },
            { status: 403 }
          );
        }
      } else {
        // No origin header — reject unless in dev mode
        if (!isDev) {
          return NextResponse.json(
            { error: "CSRF check failed" },
            { status: 403 }
          );
        }
      }
    }

    // 3. Auth check
    const session = await auth();

    if (authLevel !== "public") {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Enforce server-side session expiry for non-admin users
      if (session.sessionExpired && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 }
        );
      }

      if (authLevel === "admin" && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 4. Call handler
    const handlerCtx = {
      session: session as Session,
      ...(ctx?.params !== undefined ? { params: ctx.params } : {}),
    };

    return handler(req, handlerCtx);
  };
}
