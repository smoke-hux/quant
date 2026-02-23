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

  useEffect(() => {
    fetch("/api/schedule/check")
      .then((res) => res.json())
      .then(setSchedule);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          System Unavailable
        </h1>

        {schedule?.todaySchedule?.isActive ? (
          <p className="text-gray-600 mb-4">
            System available today from{" "}
            <span className="font-semibold">
              {schedule.todaySchedule.startTime}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {schedule.todaySchedule.endTime}
            </span>
          </p>
        ) : (
          <p className="text-gray-600 mb-4">
            The system is not available today ({schedule?.currentDay}).
          </p>
        )}

        {schedule?.nextAvailable && (
          <p className="text-sm text-gray-500 mb-6">
            Next available: {schedule.nextAvailable}
          </p>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
