"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface ScheduleInfo {
  allowed: boolean;
  currentDay: string;
  todaySchedule: {
    startTime: string;
    endTime: string;
    isActive: boolean;
  } | null;
  nextAvailable: string | null;
}

export default function UnavailablePage() {
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch("/api/schedule/check")
      .then((res) => res.json())
      .then(setSchedule);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full mx-4 page-enter">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
          {/* Animated clock icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse-ring" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center animate-tick">
              <svg
                className="w-10 h-10 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            System Unavailable
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Access is restricted outside of scheduled work hours.
          </p>

          {/* Current time display */}
          <div className="bg-gray-50 rounded-xl px-6 py-4 mb-6 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
              Current Time
            </p>
            <p className="text-2xl font-mono font-bold text-gray-900 tabular-nums animate-countdown">
              {timeStr}
            </p>
          </div>

          {/* Schedule info */}
          {schedule?.todaySchedule?.isActive ? (
            <div className="bg-blue-50 rounded-xl px-6 py-4 mb-6 border border-blue-100">
              <p className="text-xs text-blue-500 uppercase tracking-wider font-medium mb-1">
                Today&apos;s Schedule
              </p>
              <p className="text-lg font-semibold text-blue-900">
                {schedule.todaySchedule.startTime}{" "}
                <span className="text-blue-400 font-normal mx-1">to</span>{" "}
                {schedule.todaySchedule.endTime}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl px-6 py-4 mb-6 border border-gray-100">
              <p className="text-sm text-gray-500">
                The system is not available today
                {schedule?.currentDay ? ` (${schedule.currentDay})` : ""}.
              </p>
            </div>
          )}

          {schedule?.nextAvailable && (
            <div className="flex items-center justify-center gap-2 mb-6 text-sm">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-500">
                Next available: <span className="font-medium text-gray-700">{schedule.nextAvailable}</span>
              </span>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Branding */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Trumpet Courts &middot; Work Time Management
        </p>
      </div>
    </div>
  );
}
