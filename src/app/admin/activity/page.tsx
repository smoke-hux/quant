"use client";

import { useEffect, useState } from "react";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-50 text-green-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  FILE_UPLOAD: "bg-blue-50 text-blue-700",
  FILE_EDIT: "bg-amber-50 text-amber-700",
  FILE_DOWNLOAD: "bg-purple-50 text-purple-700",
};

function SkeletonActivity() {
  return (
    <div className="max-w-5xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-36" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton skeleton-avatar" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton skeleton-text w-40" />
              <div className="skeleton skeleton-text w-56" style={{ height: "0.75rem" }} />
            </div>
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    if (filter) params.set("action", filter);

    fetch(`/api/activity?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, page]);

  const totalPages = Math.ceil(total / limit);

  if (loading && logs.length === 0) {
    return <SkeletonActivity />;
  }

  return (
    <div className="max-w-5xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-gray-500 mt-1">
            Track user login, logout, and file activity.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="FILE_UPLOAD">File Upload</option>
          <option value="FILE_EDIT">File Edit</option>
          <option value="FILE_DOWNLOAD">File Download</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center"
                >
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">No activity logs found.</p>
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  className="table-row-hover row-enter"
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {(log.user.name || log.user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user.name || "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {log.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{page * limit + 1}</span>–<span className="font-medium">{Math.min((page + 1) * limit, total)}</span>{" "}
              of <span className="font-medium">{total}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white hover:border-gray-300 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white hover:border-gray-300 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
