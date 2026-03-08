"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { DocumentsPanel } from "@/components/documents-panel";
import {
  FolderOpen,
  Plus,
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast-provider";
import { timeAgo } from "@/lib/time-utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  assignedTo: User | null;
  createdBy: User;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETED"];

function SkeletonProjects() {
  return (
    <div className="max-w-6xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-32" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("PENDING");
  const [bulkAssignTo, setBulkAssignTo] = useState<string>("");
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    assignedToId: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ])
      .then(([projectsData, usersData]) => {
        setProjects(projectsData);
        setUsers(usersData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function fetchProjects() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setSelectedIds(new Set());
      });
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("name", uploadForm.name);
    formData.append("description", uploadForm.description);
    if (uploadForm.assignedToId)
      formData.append("assignedToId", uploadForm.assignedToId);
    formData.append("file", file);

    const res = await fetch("/api/projects", { method: "POST", body: formData });
    if (res.ok) {
      toast({ title: `Project "${uploadForm.name}" created`, variant: "success" });
    } else {
      toast({ title: "Failed to upload project", variant: "error" });
    }

    setShowUpload(false);
    setUploadForm({ name: "", description: "", assignedToId: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    fetchProjects();
  }

  async function handleAssign(projectId: string, assignedToId: string) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, assignedToId: assignedToId || null }),
    });
    toast({ title: "Assignment updated", variant: "info" });
    fetchProjects();
  }

  async function handleStatusChange(projectId: string, status: string) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, status }),
    });
    toast({ title: `Status changed to ${status.replace(/_/g, " ")}`, variant: "info" });
    fetchProjects();
  }

  async function handleDeleteProject(projectId: string, projectName: string) {
    if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: `Project "${projectName}" deleted`, variant: "success" });
      fetchProjects();
    } else {
      toast({ title: "Failed to delete project", variant: "error" });
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return;

    const projectIds = Array.from(selectedIds);
    const body: Record<string, unknown> = { projectIds, action: bulkAction };

    if (bulkAction === "UPDATE_STATUS") body.status = bulkStatus;
    if (bulkAction === "TRANSFER") body.assignedToId = bulkAssignTo || null;

    if (bulkAction === "DELETE") {
      if (!confirm(`Delete ${projectIds.length} project(s)? This cannot be undone.`)) return;
    }

    const res = await fetch("/api/projects/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const label = bulkAction === "UPDATE_STATUS" ? "updated" : bulkAction === "TRANSFER" ? "transferred" : "deleted";
      toast({ title: `${data.count} project(s) ${label}`, variant: "success" });
      setBulkAction("");
      fetchProjects();
    } else {
      toast({ title: "Bulk action failed", variant: "error" });
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
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  if (loading) {
    return <SkeletonProjects />;
  }

  // Filter logic
  const filtered = projects.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    PENDING: projects.filter((p) => p.status === "PENDING").length,
    IN_PROGRESS: projects.filter((p) => p.status === "IN_PROGRESS").length,
    COMPLETED: projects.filter((p) => p.status === "COMPLETED").length,
  };

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length;

  return (
    <div className="max-w-6xl page-enter">
      <PageHeader
        title="Projects"
        description="Upload Excel files and assign them to users."
        badge={{ label: "PROJECTS", icon: FolderOpen }}
        count={projects.length}
        actions={
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200/50 cursor-pointer transition-colors"
          >
            {showUpload ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showUpload ? "Cancel" : "Upload Project"}
          </button>
        }
      />

      {/* Upload Form */}
      {showUpload && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Project</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
                <select
                  value={uploadForm.assignedToId}
                  onChange={(e) => setUploadForm({ ...uploadForm, assignedToId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users
                    .filter((u) => u.role !== "ADMIN")
                    .map((user) => (
                      <option key={user.id} value={user.id}>{user.name || user.email}</option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Optional project description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Excel File (.xlsx)</label>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200/50 cursor-pointer transition-colors"
            >
              {uploading ? (
                <>
                  <div className="spinner-sm" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <SearchInput
          placeholder="Search projects..."
          value={search}
          onChange={setSearch}
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                statusFilter === tab.key ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {statusCounts[tab.key as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center gap-3 animate-fade-in-up">
          <span className="text-sm font-semibold text-blue-700">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Choose action...</option>
            <option value="UPDATE_STATUS">Change Status</option>
            <option value="TRANSFER">Transfer Ownership</option>
            <option value="DELETE">Delete</option>
          </select>
          {bulkAction === "UPDATE_STATUS" && (
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="text-sm border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          )}
          {bulkAction === "TRANSFER" && (
            <select
              value={bulkAssignTo}
              onChange={(e) => setBulkAssignTo(e.target.value)}
              className="text-sm border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name || user.email}</option>
              ))}
            </select>
          )}
          {bulkAction && (
            <button
              onClick={handleBulkAction}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
                bulkAction === "DELETE"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Apply
            </button>
          )}
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkAction(""); }}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      <DataTable
        isEmpty={filtered.length === 0}
        empty={
          <div>
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {search ? "No projects match your search." : "No projects yet. Upload one to get started."}
            </p>
          </div>
        }
        headers={
          <>
            <th className="px-3 py-3.5 text-left">
              <button onClick={toggleSelectAll} className="cursor-pointer text-gray-400 hover:text-gray-600">
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : someSelected ? (
                  <MinusSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </>
        }
      >
        {filtered.map((project, i) => (
          <React.Fragment key={project.id}>
            <tr
              className={`table-row-hover row-enter ${selectedIds.has(project.id) ? "bg-blue-50/50" : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="px-3 py-4">
                <button onClick={() => toggleSelect(project.id)} className="cursor-pointer text-gray-400 hover:text-gray-600">
                  {selectedIds.has(project.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{project.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  {project.fileName}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={project.assignedTo?.id || ""}
                  onChange={(e) => handleAssign(project.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name || user.email}</option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(project.id, e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border-0 cursor-pointer ${
                    project.status === "PENDING" ? "bg-amber-50 text-amber-700" :
                    project.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" :
                    "bg-green-50 text-green-700"
                  }`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {timeAgo(project.updatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      expandedProjectId === project.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                    title="View documents"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            {expandedProjectId === project.id && (
              <tr>
                <td colSpan={7} className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                  <DocumentsPanel
                    projectId={project.id}
                    projectName={project.name}
                    isAdmin={true}
                    currentUserId={session?.user?.id}
                  />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </DataTable>
    </div>
  );
}
