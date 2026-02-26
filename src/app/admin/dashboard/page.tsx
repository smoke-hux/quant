"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface OnlineUser {
  id: string;
  name: string | null;
  email: string;
  lastActivity: string | null;
}

interface TodayStats {
  totalLogins: number;
  activeUsers: number;
  filesEdited: number;
  filesUploaded: number;
  filesDownloaded: number;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  timestamp: string;
  user: { id: string; name: string | null; email: string };
}

interface ActiveProject {
  id: string;
  name: string;
  status: string;
  fileName: string;
  updatedAt: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
}

interface UserStatus {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "online" | "idle" | "offline";
  lastActivity: string | null;
}

interface DashboardData {
  onlineUsers: OnlineUser[];
  todayStats: TodayStats;
  recentActivity: ActivityLog[];
  activeProjects: ActiveProject[];
  userStatuses: UserStatus[];
  pendingAccessRequests: number;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  FILE_UPLOAD: "bg-blue-100 text-blue-700",
  FILE_EDIT: "bg-amber-100 text-amber-700",
  FILE_DOWNLOAD: "bg-purple-100 text-purple-700",
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-400",
  offline: "bg-gray-300",
};

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SkeletonDashboard() {
  return (
    <div className="max-w-7xl page-enter">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        setLastRefresh(new Date());
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return <SkeletonDashboard />;
  }

  const onlineCount = data.userStatuses.filter(
    (u) => u.status === "online"
  ).length;
  const idleCount = data.userStatuses.filter(
    (u) => u.status === "idle"
  ).length;

  const statCards = [
    {
      label: "Online Now",
      value: onlineCount,
      sub: idleCount > 0 ? `+${idleCount} idle` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.997M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      dot: true,
      gradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100 text-green-600",
    },
    {
      label: "Logins Today",
      value: data.todayStats.totalLogins,
      sub: `${data.todayStats.activeUsers} unique users`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      ),
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      label: "Files Edited",
      value: data.todayStats.filesEdited,
      sub: "today",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      gradient: "from-amber-50 to-yellow-50",
      iconBg: "bg-amber-100 text-amber-600",
    },
    {
      label: "Uploaded",
      value: data.todayStats.filesUploaded,
      sub: "today",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      gradient: "from-violet-50 to-purple-50",
      iconBg: "bg-violet-100 text-violet-600",
    },
    {
      label: "Downloads",
      value: data.todayStats.filesDownloaded,
      sub: "today",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
      gradient: "from-rose-50 to-pink-50",
      iconBg: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="max-w-7xl page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Live Dashboard
          </h2>
          <p className="text-gray-500 mt-1">
            Monitor all user activity in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm"
          >
            <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards — Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl border border-gray-100 p-5 card-enter hover-lift`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.dot && (
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
            {card.sub && (
              <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Pending Access Requests Banner */}
      {data.pendingAccessRequests > 0 && (
        <Link
          href="/admin/access-requests"
          className="block mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-6 py-4 hover:shadow-md transition-all card-enter hover-lift"
          style={{ animationDelay: "0.35s" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {data.pendingAccessRequests} pending access {data.pendingAccessRequests === 1 ? "request" : "requests"}
                </p>
                <p className="text-xs text-amber-600">
                  Users are waiting for schedule override approval
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              Review
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Middle: Activity Feed + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Live Activity Feed — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-enter" style={{ animationDelay: "0.4s" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-base font-semibold text-gray-900">
                Live Activity
              </h3>
            </div>
            <Link
              href="/admin/activity"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {data.recentActivity.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400">No activity yet.</p>
              </div>
            ) : (
              data.recentActivity.map((log, i) => (
                <div
                  key={log.id}
                  className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50/80 row-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600">
                      {(log.user.name || log.user.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {log.user.name || log.user.email}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Projects — 1 col */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-enter" style={{ animationDelay: "0.5s" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Active Projects
            </h3>
            <Link
              href="/admin/projects"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {data.activeProjects.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <p className="text-sm text-gray-400">No projects in progress.</p>
              </div>
            ) : (
              data.activeProjects.map((project, i) => (
                <div key={project.id} className="px-6 py-4 hover:bg-gray-50/80 row-enter" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {project.fileName}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 flex-shrink-0 ml-2">
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {project.assignedTo
                        ? project.assignedTo.name || project.assignedTo.email
                        : "Unassigned"}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Status Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-enter" style={{ animationDelay: "0.6s" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            All Users
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Idle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" /> Offline
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
          {data.userStatuses
            .sort((a, b) => {
              const order = { online: 0, idle: 1, offline: 2 };
              return order[a.status] - order[b.status];
            })
            .map((user, i) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="px-5 py-4 hover:bg-gray-50/80 transition-colors row-enter"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {(user.name || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[user.status]}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name || "Unnamed"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.lastActivity
                        ? timeAgo(user.lastActivity)
                        : "No activity"}
                    </p>
                  </div>
                  {user.role === "ADMIN" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 flex-shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
