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
  const [scheduleInfo, setScheduleInfo] = useState<{
    allowed: boolean;
    todaySchedule?: { startTime: string; endTime: string; isActive: boolean };
    nextAvailable?: string;
  } | null>(null);

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
          signOut({ callbackUrl: "/login" });
        }
      });
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/schedule/check")
        .then((r) => r.json())
        .then((data) => {
          if (!data.allowed) {
            router.push("/unavailable");
          }
        });

      fetch("/api/session/check")
        .then((r) => r.json())
        .then((data) => {
          if (!data.valid) {
            signOut({ callbackUrl: "/login" });
          }
        });
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        links={userLinks}
        title="User Dashboard"
        userEmail={session?.user?.email}
      />
      <div className="flex-1 flex flex-col">
        {scheduleInfo?.todaySchedule?.isActive && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 text-sm text-blue-700">
            Work hours today: {scheduleInfo.todaySchedule.startTime} –{" "}
            {scheduleInfo.todaySchedule.endTime}
          </div>
        )}
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
