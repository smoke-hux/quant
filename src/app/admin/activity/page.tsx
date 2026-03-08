"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  Download as DownloadIcon,
  Filter,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Pagination } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-input";
import { formatDateTime } from "@/lib/time-utils";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  timestamp: string;
  user: { id: string; name: string | null; email: string };
}

const ACTIONS = ["LOGIN", "LOGOUT", "FILE_UPLOAD", "FILE_EDIT", "FILE_DOWNLOAD", "PROJECT_OPEN"];

function SkeletonActivity() {
  return (
    <div className="max-w-6xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-36" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div className="bg-white/65 backdrop-blur-xl rounded-xl shadow-sm shadow-black/[0.04] border border-white/40 overflow-hidden p-4 space-y-3">
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
  const [actionFilter, setActionFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String((page - 1) * limit));
    if (actionFilter) params.set("action", actionFilter);
    if (userSearch) params.set("user", userSearch);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    fetch(`/api/activity?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actionFilter, userSearch, dateFrom, dateTo, page]);

  function handleExportCSV() {
    const header = "User,Email,Action,Details,Timestamp";
    const rows = logs.map((l) =>
      `"${l.user.name || ""}","${l.user.email}","${l.action}","${(l.details || "").replace(/"/g, '""')}","${l.timestamp}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setActionFilter("");
    setUserSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hasFilters = actionFilter || userSearch || dateFrom || dateTo;
  const totalPages = Math.ceil(total / limit);

  if (loading && logs.length === 0) {
    return <SkeletonActivity />;
  }

  return (
    <div className="max-w-6xl page-enter">
      <PageHeader
        title="Activity Log"
        description="Track user login, logout, and file activity."
        badge={{ label: "AUDIT", icon: ClipboardList }}
        count={total}
        actions={
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg hover:bg-white/80 hover:border-white/50 shadow-sm cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
        <SearchInput
          placeholder="Search by user..."
          value={userSearch}
          onChange={(v) => { setUserSearch(v); setPage(1); }}
          className="w-full sm:w-64"
        />
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {actionFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              <Filter className="w-3 h-3" />
              {actionFilter.replace(/_/g, " ")}
              <button onClick={() => setActionFilter("")} className="ml-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {userSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              User: {userSearch}
              <button onClick={() => setUserSearch("")} className="ml-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(dateFrom || dateTo) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              {dateFrom || "..."} - {dateTo || "..."}
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      <DataTable
        isEmpty={logs.length === 0}
        empty={
          <div>
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No activity logs found.</p>
          </div>
        }
        headers={
          <>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
          </>
        }
      >
        {logs.map((log, i) => (
          <tr
            key={log.id}
            className="table-row-hover row-enter"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <Avatar name={log.user.name} email={log.user.email} size="sm" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{log.user.name || "\u2014"}</div>
                  <div className="text-xs text-gray-400">{log.user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge status={log.action} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
              {log.details || <span className="text-gray-300">&mdash;</span>}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 tabular-nums">
              {formatDateTime(log.timestamp)}
            </td>
          </tr>
        ))}
      </DataTable>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
