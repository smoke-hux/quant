"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  LogIn,
  FileEdit,
  Upload,
  Download,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Clock,
  FolderOpen,
  FileText,
  Activity,
  Eye,
  Monitor,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sparkline } from "@/components/ui/sparkline";
import { timeAgo } from "@/lib/time-utils";

/* ================================================================
   Types
   ================================================================ */
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

interface CurrentWork {
  action: string;
  details: string | null;
  timestamp: string;
}

interface UserStatus {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "online" | "idle" | "offline";
  lastActivity: string | null;
  currentWork: CurrentWork | null;
}

interface DashboardData {
  onlineUsers: { id: string; name: string | null; email: string; lastActivity: string | null }[];
  todayStats: TodayStats;
  recentActivity: ActivityLog[];
  activeProjects: ActiveProject[];
  userStatuses: UserStatus[];
  pendingAccessRequests: number;
}

interface TrendData {
  days: string[];
  logins: number[];
  edits: number[];
  uploads: number[];
  downloads: number[];
}

/* ================================================================
   Helpers
   ================================================================ */
function getActionLabel(action: string): { label: string; icon: typeof FileEdit } {
  switch (action) {
    case "FILE_EDIT":
      return { label: "Editing", icon: FileEdit };
    case "FILE_UPLOAD":
      return { label: "Uploading", icon: Upload };
    case "FILE_DOWNLOAD":
      return { label: "Downloading", icon: Download };
    case "PROJECT_OPEN":
      return { label: "Viewing", icon: Eye };
    default:
      return { label: action.replace(/_/g, " "), icon: Activity };
  }
}

/* ================================================================
   Skeleton
   ================================================================ */
function SkeletonDashboard() {
  return (
    <div className="max-w-7xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}

/* ================================================================
   Main
   ================================================================ */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "idle" | "offline">("all");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/admin/dashboard").then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/dashboard/trends").then((r) => r.ok ? r.json() : null),
    ])
      .then(([dashData, trendData]) => {
        if (dashData) setData(dashData);
        if (trendData) setTrends(trendData);
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

  const onlineCount = data.userStatuses.filter((u) => u.status === "online").length;
  const idleCount = data.userStatuses.filter((u) => u.status === "idle").length;
  const offlineCount = data.userStatuses.filter((u) => u.status === "offline").length;

  const statCards = [
    {
      label: "Online Now",
      value: onlineCount,
      sub: idleCount > 0 ? `+${idleCount} idle` : undefined,
      icon: Users,
      dot: true,
      gradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100 text-green-600",
      sparkData: trends?.logins,
      sparkColor: "#22c55e",
    },
    {
      label: "Logins Today",
      value: data.todayStats.totalLogins,
      sub: `${data.todayStats.activeUsers} unique users`,
      icon: LogIn,
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100 text-blue-600",
      sparkData: trends?.logins,
      sparkColor: "#3b82f6",
    },
    {
      label: "Files Edited",
      value: data.todayStats.filesEdited,
      sub: "today",
      icon: FileEdit,
      gradient: "from-amber-50 to-yellow-50",
      iconBg: "bg-amber-100 text-amber-600",
      sparkData: trends?.edits,
      sparkColor: "#f59e0b",
    },
    {
      label: "Uploaded",
      value: data.todayStats.filesUploaded,
      sub: "today",
      icon: Upload,
      gradient: "from-violet-50 to-purple-50",
      iconBg: "bg-violet-100 text-violet-600",
      sparkData: trends?.uploads,
      sparkColor: "#8b5cf6",
    },
    {
      label: "Downloads",
      value: data.todayStats.filesDownloaded,
      sub: "today",
      icon: Download,
      gradient: "from-rose-50 to-pink-50",
      iconBg: "bg-rose-100 text-rose-600",
      sparkData: trends?.downloads,
      sparkColor: "#f43f5e",
    },
  ];

  // Filter users for the status grid
  const filteredUsers = data.userStatuses
    .filter((u) => statusFilter === "all" || u.status === statusFilter)
    .sort((a, b) => {
      const order = { online: 0, idle: 1, offline: 2 };
      return order[a.status] - order[b.status];
    });

  const statusFilterButtons = [
    { key: "all" as const, label: "All", count: data.userStatuses.length },
    { key: "online" as const, label: "Online", count: onlineCount },
    { key: "idle" as const, label: "Idle", count: idleCount },
    { key: "offline" as const, label: "Offline", count: offlineCount },
  ];

  return (
    <div className="max-w-7xl page-enter">
      {/* Header */}
      <PageHeader
        title="Live Dashboard"
        description="Monitor all user activity in real time."
        badge={{ label: "LIVE", icon: Activity }}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:inline">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl border border-gray-100 p-5 card-enter hover-lift cursor-default`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
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
            {/* Sparkline */}
            {card.sparkData && card.sparkData.length > 0 && (
              <div className="mt-2 -mx-1">
                <Sparkline data={card.sparkData} color={card.sparkColor} height={32} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pending Access Requests Banner */}
      {data.pendingAccessRequests > 0 && (
        <Link
          href="/admin/access-requests"
          className="block mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-6 py-4 hover:shadow-md transition-all card-enter hover-lift cursor-pointer"
          style={{ animationDelay: "0.35s" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-600" />
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
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      )}

      {/* Middle: Activity Feed + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Live Activity Feed */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden card-enter" style={{ animationDelay: "0.4s" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-base font-semibold text-gray-900">Live Activity</h3>
            </div>
            <Link href="/admin/activity" className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
              View all
            </Link>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {data.recentActivity.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No activity yet.</p>
              </div>
            ) : (
              data.recentActivity.map((log, i) => (
                <div
                  key={log.id}
                  className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50/80 row-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <Avatar name={log.user.name} email={log.user.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {log.user.name || log.user.email}
                      </span>
                      <StatusBadge status={log.action} />
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{log.details}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Projects */}
        <Card className="!p-0 overflow-hidden card-enter" style={{ animationDelay: "0.5s" }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Active Projects</h3>
            <Link href="/admin/projects" className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
              View all
            </Link>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {data.activeProjects.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No projects in progress.</p>
              </div>
            ) : (
              data.activeProjects.map((project, i) => (
                <div key={project.id} className="px-6 py-4 hover:bg-gray-50/80 row-enter" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {project.fileName}
                      </p>
                    </div>
                    <StatusBadge status="IN_PROGRESS" className="flex-shrink-0 ml-2" />
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
        </Card>
      </div>

      {/* User Status Grid */}
      <Card className="!p-0 overflow-hidden card-enter" style={{ animationDelay: "0.6s" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">User Activity Monitor</h3>
          </div>
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5">
            {statusFilterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setStatusFilter(btn.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === btn.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {btn.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  statusFilter === btn.key ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No {statusFilter} users.</p>
            </div>
          ) : (
            filteredUsers.map((user, i) => {
              const work = user.currentWork;
              const actionInfo = work ? getActionLabel(work.action) : null;
              const ActionIcon = actionInfo?.icon;

              return (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors row-enter cursor-pointer"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <Avatar name={user.name} email={user.email} size="sm" status={user.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || "Unnamed"}
                      </p>
                      {user.role === "ADMIN" && (
                        <StatusBadge status="ADMIN" className="flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {/* Current activity */}
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    {work && actionInfo && ActionIcon ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                        <ActionIcon className="w-3.5 h-3.5 text-blue-500" />
                        <div className="text-xs">
                          <span className="font-medium text-blue-700">{actionInfo.label}</span>
                          {work.details && (
                            <span className="text-blue-500 ml-1 max-w-[160px] truncate inline-block align-bottom">
                              {work.details}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : user.status !== "offline" ? (
                      <span className="text-xs text-gray-400 italic">No recent file activity</span>
                    ) : null}
                  </div>
                  {/* Time info */}
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={user.status} showDot />
                    <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                      {user.lastActivity ? timeAgo(user.lastActivity) : "No activity"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
