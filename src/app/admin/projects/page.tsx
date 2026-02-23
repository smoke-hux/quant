"use client";

import { useEffect, useState, useRef } from "react";

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-1">
            Upload Excel files and assign them to users.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          {showUpload ? "Cancel" : "Upload Project"}
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload New Project
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excel File (.xlsx)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No projects yet. Upload one to get started.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="text-sm text-gray-500">
                        {project.description}
                      </div>
                    )}
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
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1"
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
                      className={`text-xs font-medium rounded-lg px-2 py-1 border-0 ${statusColors[project.status]}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
