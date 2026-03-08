"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileSpreadsheet,
  FolderOpen,
  Activity,
  User,
  Calendar,
  LogIn,
  LogOut,
  FileEdit,
  Upload,
  Download,
  Eye,
  Monitor,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { timeAgo } from "@/lib/time-utils";

interface UserStats {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  };
  stats: {
    totalHours: number;
    totalSessions: number;
    filesWorkedOn: number;
    projectNames: string[];
  };
  liveStatus: {
    status: "online" | "idle" | "offline";
    lastActivity: string | null;
    currentWork: {
      action: string;
      details: string | null;
      timestamp: string;
    } | null;
    todaySummary: {
      edits: number;
      uploads: number;
      downloads: number;
    };
  };
  sessions: {
    login: string;
    logout: string | null;
    duration: number;
  }[];
  fileActivity: {
    action: string;
    details: string | null;
    timestamp: string;
  }[];
}

function getActionLabel(action: string) {
  switch (action) {
    case "FILE_EDIT": return { label: "Editing", icon: FileEdit, color: "text-amber-600", bg: "bg-amber-50" };
    case "FILE_UPLOAD": return { label: "Uploading", icon: Upload, color: "text-blue-600", bg: "bg-blue-50" };
    case "FILE_DOWNLOAD": return { label: "Downloading", icon: Download, color: "text-purple-600", bg: "bg-purple-50" };
    case "PROJECT_OPEN": return { label: "Viewing", icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" };
    default: return { label: action.replace(/_/g, " "), icon: Activity, color: "text-gray-600", bg: "bg-gray-50" };
  }
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function SkeletonStats() {
  return (
    <div className="max-w-5xl page-enter">
      <div className="skeleton h-4 w-28 rounded mb-6" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton skeleton-title w-48" />
            <div className="skeleton skeleton-text w-64" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="skeleton skeleton-title w-40" />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="skeleton skeleton-title w-32" />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserStatsPage() {
  const params = useParams();
  const [data, setData] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${params.id}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load user statistics");
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <SkeletonStats />;
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl page-enter">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 flex-shrink-0" />
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const { user, stats, sessions, fileActivity, liveStatus } = data;
  const currentWork = liveStatus.currentWork;
  const actionInfo = currentWork ? getActionLabel(currentWork.action) : null;
  const ActionIcon = actionInfo?.icon;

  const statCards = [
    {
      label: "Total Hours",
      value: stats.totalHours,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-100",
    },
    {
      label: "Sessions",
      value: stats.totalSessions,
      icon: LogIn,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
    {
      label: "Files Worked On",
      value: stats.filesWorkedOn,
      icon: FileSpreadsheet,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-100",
    },
    {
      label: "Projects",
      value: stats.projectNames.length,
      icon: FolderOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-100",
    },
  ];

  return (
    <div className="max-w-5xl page-enter">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-4 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* User Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 card-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} email={user.email} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.name || "Unnamed User"}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <StatusBadge status={user.role} />
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Project tags */}
        {stats.projectNames.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assigned Projects</p>
            <div className="flex flex-wrap gap-2">
              {stats.projectNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg"
                >
                  <FolderOpen className="w-3 h-3" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Status Banner */}
      <div
        className={`rounded-xl border p-4 mb-6 card-enter ${
          liveStatus.status === "online"
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            : liveStatus.status === "idle"
            ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
            : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
        }`}
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              liveStatus.status === "online" ? "bg-green-100" : liveStatus.status === "idle" ? "bg-amber-100" : "bg-gray-100"
            }`}>
              <Monitor className={`w-5 h-5 ${
                liveStatus.status === "online" ? "text-green-600" : liveStatus.status === "idle" ? "text-amber-600" : "text-gray-400"
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  liveStatus.status === "online" ? "bg-green-500 animate-pulse" : liveStatus.status === "idle" ? "bg-amber-500" : "bg-gray-400"
                }`} />
                <span className={`text-sm font-semibold capitalize ${
                  liveStatus.status === "online" ? "text-green-800" : liveStatus.status === "idle" ? "text-amber-800" : "text-gray-600"
                }`}>
                  {liveStatus.status}
                </span>
                {liveStatus.lastActivity && (
                  <span className="text-xs text-gray-400">
                    &middot; Last seen {timeAgo(liveStatus.lastActivity)}
                  </span>
                )}
              </div>
              {currentWork && actionInfo && ActionIcon ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <ActionIcon className={`w-3.5 h-3.5 ${actionInfo.color}`} />
                  <span className={`text-xs font-medium ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                  {currentWork.details && (
                    <span className="text-xs text-gray-500">&mdash; {currentWork.details}</span>
                  )}
                  <span className="text-[11px] text-gray-400 ml-1">
                    ({timeAgo(currentWork.timestamp)})
                  </span>
                </div>
              ) : liveStatus.status !== "offline" ? (
                <p className="text-xs text-gray-400 mt-1">No recent file activity</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">User is not currently active</p>
              )}
            </div>
          </div>
          {/* Today's Quick Summary */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{liveStatus.todaySummary.edits}</p>
              <p className="text-[10px] text-gray-400 font-medium">Edits Today</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{liveStatus.todaySummary.uploads}</p>
              <p className="text-[10px] text-gray-400 font-medium">Uploads</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{liveStatus.todaySummary.downloads}</p>
              <p className="text-[10px] text-gray-400 font-medium">Downloads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-enter group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ring-1 ${stat.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session History + File Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-enter" style={{ animationDelay: "120ms" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-gray-400" />
              Session History
            </h3>
            <span className="text-xs text-gray-400 font-medium">{sessions.length} sessions</span>
          </div>
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No sessions recorded</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {sessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-6 py-3 border-b border-gray-50 last:border-0 table-row-hover row-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.logout ? "bg-gray-300" : "bg-emerald-500 animate-pulse"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(s.login).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      {!s.logout && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.login).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      {s.logout && (
                        <> &mdash; {new Date(s.logout).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    {formatDuration(s.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-enter" style={{ animationDelay: "180ms" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
              File Activity
            </h3>
            <span className="text-xs text-gray-400 font-medium">{fileActivity.length} actions</span>
          </div>
          {fileActivity.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No file activity recorded</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {fileActivity.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-6 py-3 border-b border-gray-50 last:border-0 table-row-hover row-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <StatusBadge status={log.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {log.details || "\u2014"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
