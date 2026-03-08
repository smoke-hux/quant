import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

// Dummy hash for constant-time comparison when user doesn't exist (prevents timing attacks)
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

// Build providers list — only include Google if credentials are configured
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
  ...authConfig,
  // Only trust host header in development; in production, set NEXTAUTH_URL
  trustHost: process.env.NODE_ENV === "development",
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Reject OAuth users without an email
      if (!user.email) {
        return false;
      }

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
            data: {
              userId: dbUser.id,
              action: "LOGIN",
            },
          });
        }
      } catch (e) {
        console.error("Error in signIn callback:", e);
        // Block sign-in if we can't verify/create the user in the database
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // On initial sign-in, user object is available
        // For credentials provider, role comes from authorize() return
        // For OAuth, we need to look it up
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
        // Set session start time on initial sign-in
        token.sessionStart = Date.now();
        token.expired = false;
      }

      // Check temp admin expiry and sync role from DB
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, tempAdminUntil: true },
        });
        if (dbUser) {
          if (dbUser.tempAdminUntil && new Date(dbUser.tempAdminUntil) < new Date()) {
            // Temp admin expired — revert to USER
            await prisma.user.update({
              where: { id: token.id as string },
              data: { role: "USER", tempAdminUntil: null },
            });
            await prisma.activityLog.create({
              data: {
                userId: token.id as string,
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
        }
      }

      // Check 2-hour session limit for non-admin users
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (
        token.role !== "ADMIN" &&
        token.sessionStart &&
        Date.now() - (token.sessionStart as number) > TWO_HOURS
      ) {
        token.expired = true;
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
      return session;
    },
  },
});
