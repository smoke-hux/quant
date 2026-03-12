import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
      isTempAdmin?: boolean;
    };
    /** Whether the session has expired (absolute timeout or revoked) */
    sessionExpired?: boolean;
    /** ISO timestamp when this session expires */
    expiresAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    /** DB session token for tracking/revocation */
    sessionToken?: string;
    /** Absolute session start (epoch ms) */
    sessionStart?: number;
    /** Last time we validated against the DB (epoch ms) */
    lastChecked?: number;
    /** Whether the session has expired or been revoked */
    expired?: boolean;
    isTempAdmin?: boolean;
  }
}
