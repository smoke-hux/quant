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

  // Access request state
  const [hasPending, setHasPending] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    fetch("/api/schedule/check")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setSchedule)
      .catch(() => {});

    // Check if user already has a pending request
    fetch("/api/access-requests")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.hasPending) setHasPending(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setRequestError("");

    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRequestError(data.error || "Failed to send request");
        setSending(false);
        return;
      }

      setRequestSent(true);
      setHasPending(true);
      setSending(false);
    } catch {
      setRequestError("Something went wrong. Please try again.");
      setSending(false);
    }
  }

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full mx-4 page-enter">
        <div className="bg-white/65 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/[0.06] border border-white/40 p-8 text-center">
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

          {/* Request Access Section */}
          <div className="border-t border-gray-100 pt-6 mt-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Need access now?</h3>
            <p className="text-xs text-gray-400 mb-4">
              Send a request to the admin and they can grant you temporary access.
            </p>

            {requestSent || hasPending ? (
              <div className="bg-green-50 rounded-xl px-5 py-4 border border-green-100 animate-fade-in-up">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Request sent</span>
                </div>
                <p className="text-xs text-green-600">
                  An admin will review your request. You&apos;ll get access once it&apos;s approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Reason for access (optional)"
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400"
                />

                {requestError && (
                  <p className="text-xs text-red-600 animate-slide-in">{requestError}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200/50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Request Access
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Branding */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Trumpet Courts &middot; Work Time Management
        </p>
      </div>
    </div>
  );
}
