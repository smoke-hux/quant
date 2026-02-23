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
  LOGIN: "bg-green-100 text-green-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  FILE_UPLOAD: "bg-blue-100 text-blue-800",
  FILE_EDIT: "bg-yellow-100 text-yellow-800",
  FILE_DOWNLOAD: "bg-purple-100 text-purple-800",
};

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

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-gray-600 mt-1">
            Track user login, logout, and file activity.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
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
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user.name || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)}{" "}
              of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
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
