"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

function formatDuration(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function actionBadge(action: string) {
  const colors: Record<string, string> = {
    FILE_EDIT: "bg-yellow-100 text-yellow-800",
    FILE_UPLOAD: "bg-green-100 text-green-800",
    FILE_DOWNLOAD: "bg-blue-100 text-blue-800",
  };
  return colors[action] || "bg-gray-100 text-gray-800";
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl">
        <Link
          href="/admin/users"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Users
        </Link>
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const { user, stats, sessions, fileActivity } = data;

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/users"
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        &larr; Back to Users
      </Link>

      {/* User Info Header */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.name || "Unnamed User"}
            </h2>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {user.role}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total Hours</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.totalHours}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total Sessions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.totalSessions}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Files Worked On</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.filesWorkedOn}
          </p>
        </div>
      </div>

      {/* Session History */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Session History
          </h3>
        </div>
        {sessions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No sessions recorded
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((s, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(s.login).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {s.logout ? (
                      <span className="text-gray-900">
                        {new Date(s.logout).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(s.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Activity */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            File Activity
          </h3>
        </div>
        {fileActivity.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No file activity recorded
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fileActivity.map((log, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionBadge(log.action)}`}
                    >
                      {log.action.replace("FILE_", "")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.details || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
