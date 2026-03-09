import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./prisma";

// Dummy hash for constant-time comparison when user doesn't exist (prevents timing attacks)
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

// --- Session lifetime constants ---
const USER_SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const COOKIE_MAX_AGE_S = 8 * 60 * 60; // 8 hours (upper bound)
// How often to re-validate the session against the DB
const SESSION_REVALIDATE_MS = 5 * 60 * 1000; // 5 minutes

// Build providers list
const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      // Always run bcrypt.compare to prevent timing-based user enumeration
      const hashToCompare = user?.password || DUMMY_HASH;
      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        hashToCompare
      );

      if (!user || !user.password || !passwordMatch) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

// Only add Google provider if both client ID and secret are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // PrismaAdapter handles OAuth account management (Google linking).
  // Sessions use JWT strategy (required for Credentials provider) but are
  // also tracked in the DB Session table for admin revocation support.
  adapter: PrismaAdapter(prisma) as any,
  trustHost: process.env.NODE_ENV === "development",
  providers,
  pages: {
    signIn: "/login",
  },
  session: {
    // JWT strategy — required because Credentials provider doesn't support database sessions.
    // We add our own DB session tracking on top for revocation and visibility.
    strategy: "jwt",
    maxAge: COOKIE_MAX_AGE_S,
    updateAge: 5 * 60, // 5-minute sliding window
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        if (account?.provider === "google") {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                role: "USER",
              },
            });
          }
        }

        // Log the login activity
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          await prisma.activityLog.create({
            data: { userId: dbUser.id, action: "LOGIN" },
          });
        }
      } catch (e) {
        console.error("Error in signIn callback:", e);
        return false;
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      const now = Date.now();

      // --- Initial sign-in: populate token + create DB session record ---
      if (user) {
        if (user.role) {
          token.role = user.role;
          token.id = user.id;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        }

        const maxAgeMs =
          token.role === "ADMIN"
            ? ADMIN_SESSION_MAX_AGE_MS
            : USER_SESSION_MAX_AGE_MS;

        // Create a tracked session in the DB for admin visibility / revocation
        const sessionToken = crypto.randomUUID();
        await prisma.session.create({
          data: {
            sessionToken,
            userId: token.id as string,
            expires: new Date(now + maxAgeMs),
          },
        });

        token.sessionToken = sessionToken;
        token.sessionStart = now;
        token.lastChecked = now;
        token.expired = false;
        return token;
      }

      // --- Absolute session timeout ---
      if (token.sessionStart) {
        const maxAge =
          token.role === "ADMIN"
            ? ADMIN_SESSION_MAX_AGE_MS
            : USER_SESSION_MAX_AGE_MS;
        if (now - (token.sessionStart as number) > maxAge) {
          token.expired = true;
          // Clean up DB session
          if (token.sessionToken) {
            await prisma.session
              .deleteMany({ where: { sessionToken: token.sessionToken as string } })
              .catch(() => {});
          }
          return token;
        }
      }

      // --- Periodic DB revalidation (every 5 minutes) ---
      // Checks: session not revoked, user still exists, role changes, temp admin expiry
      const lastChecked = (token.lastChecked as number) || 0;
      const needsCheck =
        now - lastChecked > SESSION_REVALIDATE_MS || trigger === "update";

      if (needsCheck && token.id) {
        // 1. Check if the DB session was revoked by an admin
        if (token.sessionToken) {
          const dbSession = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken as string },
          });
          if (!dbSession || dbSession.expires < new Date()) {
            // Session revoked or expired in DB → force logout
            token.expired = true;
            return token;
          }
        }

        // 2. Verify user still exists and sync role
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tempAdminUntil: true,
          },
        });

        if (!dbUser) {
          token.expired = true;
          return token;
        }

        // 3. Handle temp admin expiry
        if (
          dbUser.tempAdminUntil &&
          new Date(dbUser.tempAdminUntil) < new Date()
        ) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "USER", tempAdminUntil: null },
          });
          await prisma.activityLog.create({
            data: {
              userId: dbUser.id,
              action: "TEMP_ADMIN_EXPIRED",
              details: "Temporary admin privileges expired",
            },
          });
          token.role = "USER";
          token.isTempAdmin = false;
        } else {
          token.role = dbUser.role;
          token.isTempAdmin = !!dbUser.tempAdminUntil;
        }

        token.email = dbUser.email;
        token.name = dbUser.name;
        token.lastChecked = now;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.isTempAdmin = token.isTempAdmin === true;
      }
      session.sessionExpired = token.expired === true;

      // Expose expiry timestamp for client-side countdown
      if (token.sessionStart) {
        const maxAge =
          token.role === "ADMIN"
            ? ADMIN_SESSION_MAX_AGE_MS
            : USER_SESSION_MAX_AGE_MS;
        session.expiresAt = new Date(
          (token.sessionStart as number) + maxAge
        ).toISOString();
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      // Clean up DB session on sign-out
      if ("token" in message && message.token) {
        const tok = message.token as any;
        if (tok.sessionToken) {
          await prisma.session
            .deleteMany({ where: { sessionToken: tok.sessionToken } })
            .catch(() => {});
        }
        if (tok.id) {
          await prisma.activityLog.create({
            data: {
              userId: tok.id,
              action: "LOGOUT",
              details: "User signed out",
            },
          });
        }
      }
    },
  },
});
