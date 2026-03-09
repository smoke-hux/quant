"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";

const userLinks = [
  {
    href: "/user/projects",
    label: "My Projects",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<{
    allowed: boolean;
    todaySchedule?: { startTime: string; endTime: string; isActive: boolean };
    nextAvailable?: string;
  } | null>(null);

  // Check schedule and session validity on mount
  useEffect(() => {
    fetch("/api/schedule/check")
      .then((r) => r.json())
      .then((data) => {
        setScheduleInfo(data);
        if (!data.allowed) {
          router.push("/unavailable");
        }
      });

    fetch("/api/session/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          signOut({ callbackUrl: "/login?reason=session_expired" });
        }
      });
  }, [router]);

  // Periodic checks: schedule every 60s, session every 30s for faster expiry detection
  useEffect(() => {
    const scheduleInterval = setInterval(() => {
      fetch("/api/schedule/check")
        .then((r) => r.json())
        .then((data) => {
          if (!data.allowed) {
            router.push("/unavailable");
          }
        });
    }, 60000);

    const sessionInterval = setInterval(() => {
      fetch("/api/session/check")
        .then((r) => r.json())
        .then((data) => {
          if (!data.valid) {
            signOut({ callbackUrl: "/login?reason=session_expired" });
          }
        });
    }, 30000);

    return () => {
      clearInterval(scheduleInterval);
      clearInterval(sessionInterval);
    };
  }, [router]);

  // Auto sign-out when the session hard-expires (client-side timer based on expiresAt)
  useEffect(() => {
    if (status !== "authenticated" || !session?.expiresAt) return;

    const expiresAt = new Date(session.expiresAt).getTime();
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      signOut({ callbackUrl: "/login?reason=session_expired" });
      return;
    }

    const timeout = setTimeout(() => {
      signOut({ callbackUrl: "/login?reason=session_expired" });
    }, remaining);

    return () => clearTimeout(timeout);
  }, [session?.expiresAt, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-gray-400 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        links={userLinks}
        title="Workspace"
        userEmail={session?.user?.email}
        userName={session?.user?.name}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/30 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-900">Trumpet Courts</h1>
        </div>
        {scheduleInfo?.todaySchedule?.isActive && (
          <div className="bg-blue-50/60 backdrop-blur-sm border-b border-blue-100/40 px-4 lg:px-6 py-2 text-sm text-blue-700">
            Work hours today: {scheduleInfo.todaySchedule.startTime} –{" "}
            {scheduleInfo.todaySchedule.endTime}
          </div>
        )}
        <main className="flex-1 p-4 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
