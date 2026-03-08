"use client";

import { useEffect, useState, useCallback } from "react";
import {
  KeyRound,
  Check,
  X,
  Shield,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast-provider";
import { timeAgo } from "@/lib/time-utils";

interface AccessRequest {
  id: string;
  message: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  user: { id: string; name: string | null; email: string };
}

const OVERRIDE_OPTIONS = [
  { label: "2h", value: 2 },
  { label: "4h", value: 4 },
  { label: "8h", value: 8 },
  { label: "12h", value: 12 },
  { label: "24h", value: 24 },
];

const FILTER_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "DENIED", label: "Denied" },
  { key: "", label: "All" },
];

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchRequests = useCallback(() => {
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
  }, [filter]);

  useEffect(() => {
    fetchRequests();
    // Auto-refresh on pending
    if (filter === "PENDING") {
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchRequests, filter]);

  async function handleAction(requestId: string, userName: string, action: "APPROVE" | "DENY") {
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
      if (res.ok) {
        toast({
          title: action === "APPROVE"
            ? `Access approved for ${userName} (${overrideHours}h override)`
            : `Access denied for ${userName}`,
          variant: action === "APPROVE" ? "success" : "info",
        });
      } else {
        const data = await res.json().catch(() => null);
        toast({ title: data?.error || "Failed to process request", variant: "error" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "error" });
    }
    setApprovingId(null);
    setActionLoading(null);
    setSelectedIds(new Set());
    fetchRequests();
  }

  async function handleBulkAction(action: "APPROVE" | "DENY") {
    for (const id of selectedIds) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        await handleAction(id, req.user.name || req.user.email, action);
      }
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pendingIds = requests.filter((r) => r.status === "PENDING").map((r) => r.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  }

  if (loading && requests.length === 0) {
    return <SkeletonRequests />;
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const hasPendingSelected = selectedIds.size > 0;

  return (
    <div className="max-w-5xl page-enter">
      <PageHeader
        title="Access Requests"
        description="Review and manage user access requests."
        badge={{ label: "REQUESTS", icon: KeyRound }}
        count={filter === "PENDING" ? pendingRequests.length : requests.length}
      />

      {/* Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setSelectedIds(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {hasPendingSelected && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkAction("APPROVE")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
            >
              <Check className="w-3 h-3" />
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("DENY")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              Deny All
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">No requests</p>
            <p className="text-xs text-gray-400">
              {filter === "PENDING"
                ? "No pending access requests right now."
                : filter
                  ? `No ${filter.toLowerCase()} requests found.`
                  : "No requests found."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Select all header (only for pending) */}
            {filter === "PENDING" && pendingRequests.length > 0 && (
              <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingRequests.length && pendingRequests.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-medium">Select all</span>
              </div>
            )}

            {requests.map((req, i) => (
              <div
                key={req.id}
                className={`px-6 py-5 hover:bg-gray-50/50 row-enter ${
                  selectedIds.has(req.id) ? "bg-blue-50/30" : ""
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Checkbox for pending */}
                    {req.status === "PENDING" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                    )}
                    <Avatar name={req.user.name} email={req.user.email} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {req.user.name || req.user.email}
                        </span>
                        <StatusBadge status={req.status} showDot />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{req.user.email}</p>
                      {req.message && (
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <p className="text-sm text-gray-600 italic">&ldquo;{req.message}&rdquo;</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Requested {timeAgo(req.createdAt)}
                        </span>
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
                          {/* Override hours as chips */}
                          <div className="flex items-center gap-1">
                            {OVERRIDE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setOverrideHours(opt.value)}
                                className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                  overrideHours === opt.value
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAction(req.id, req.user.name || req.user.email, "APPROVE")}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {actionLoading === req.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setApprovingId(null)}
                            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setApprovingId(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, req.user.name || req.user.email, "DENY")}
                            disabled={actionLoading === req.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
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
