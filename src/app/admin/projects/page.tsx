"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { DocumentsPanel } from "@/components/documents-panel";

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

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
};

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
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    assignedToId: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .then(setProjects);
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

    await fetch("/api/projects", { method: "POST", body: formData });

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
    fetchProjects();
  }

  async function handleStatusChange(projectId: string, status: string) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, status }),
    });
    fetchProjects();
  }

  if (loading) {
    return <SkeletonProjects />;
  }

  return (
    <div className="max-w-6xl page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 mt-1">
            Upload Excel files and assign them to users.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200/50 flex items-center gap-2"
        >
          {showUpload ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Project
            </>
          )}
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload New Project
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Assign To
                </label>
                <select
                  value={uploadForm.assignedToId}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      assignedToId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users
                    .filter((u) => u.role !== "ADMIN")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Optional project description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Excel File (.xlsx)
              </label>
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
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200/50 flex items-center gap-2"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Docs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center"
                >
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <p className="text-sm text-gray-400">No projects yet. Upload one to get started.</p>
                </td>
              </tr>
            ) : (
              projects.map((project, i) => (
                <React.Fragment key={project.id}>
                  <tr
                    className="table-row-hover row-enter"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={project.assignedTo?.id || ""}
                        onChange={(e) =>
                          handleAssign(project.id, e.target.value)
                        }
                        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={project.status}
                        onChange={(e) =>
                          handleStatusChange(project.id, e.target.value)
                        }
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border-0 ${statusColors[project.status]}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(project.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          expandedProjectId === project.id
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        }`}
                        title="View documents"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expandedProjectId === project.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
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
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
