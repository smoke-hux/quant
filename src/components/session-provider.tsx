"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Re-fetch session every 4 minutes to keep it fresh.
      // With database sessions, this also extends the session expiry
      // via the sliding window (updateAge) configured server-side.
      refetchInterval={4 * 60}
      // Re-fetch immediately when the user switches back to this tab
      // so expired/revoked sessions are caught right away.
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
