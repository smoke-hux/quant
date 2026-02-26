"use client";

import { useEffect, useState } from "react";

interface AccessRequest {
  id: string;
  message: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  user: { id: string; name: string | null; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  DENIED: "bg-red-50 text-red-700",
};

const OVERRIDE_OPTIONS = [
  { label: "2 hours", value: 2 },
  { label: "4 hours", value: 4 },
  { label: "8 hours", value: 8 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
];

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

function SkeletonRequests() {
  return (
    <div className="max-w-5xl page-enter">
      <div className="mb-6">
        <div className="skeleton skeleton-title w-44" />
        <div className="skeleton skeleton-text w-72" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton skeleton-avatar" />
            <div className="flex-1 space-y-2">
              <div className="skeleton skeleton-text w-40" />
              <div className="skeleton skeleton-text w-64" style={{ height: "0.75rem" }} />
            </div>
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [overrideHours, setOverrideHours] = useState(8);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  function fetchRequests() {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/access-requests${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleAction(requestId: string, action: "APPROVE" | "DENY") {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/access-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          ...(action === "APPROVE" ? { overrideHours } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to process request");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setApprovingId(null);
    setActionLoading(null);
    fetchRequests();
  }

  if (loading && requests.length === 0) {
    return <SkeletonRequests />;
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-5xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Access Requests</h2>
            {filter === "PENDING" && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            Review and manage user access requests.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED">Denied</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm font-medium text-gray-900 mb-1">No requests</p>
            <p className="text-xs text-gray-400">
              {filter === "PENDING"
                ? "No pending access requests right now."
                : `No ${filter.toLowerCase()} requests found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req, i) => (
              <div
                key={req.id}
                className="px-6 py-5 hover:bg-gray-50/50 row-enter"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">
                        {(req.user.name || req.user.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {req.user.name || req.user.email}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[req.status]}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{req.user.email}</p>
                      {req.message && (
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <p className="text-sm text-gray-600 italic">&ldquo;{req.message}&rdquo;</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Requested {timeAgo(req.createdAt)}</span>
                        {req.reviewedAt && (
                          <span>Reviewed {timeAgo(req.reviewedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending requests */}
                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {approvingId === req.id ? (
                        <div className="flex items-center gap-2 animate-fade-in-up">
                          <select
                            value={overrideHours}
                            onChange={(e) => setOverrideHours(Number(e.target.value))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          >
                            {OVERRIDE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAction(req.id, "APPROVE")}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === req.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setApprovingId(null)}
                            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setApprovingId(req.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "DENY")}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Deny
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
