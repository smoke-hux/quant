// Shared auth constants.
// Main auth config is in auth.ts (JWT + PrismaAdapter + DB session tracking).
// Middleware is a custom cookie check in middleware.ts.

export const USER_SESSION_MAX_AGE_S = 2 * 60 * 60; // 2 hours
export const ADMIN_SESSION_MAX_AGE_S = 8 * 60 * 60; // 8 hours
