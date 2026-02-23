"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function UserProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
        <p className="text-gray-600 mt-1">
          Your assigned Excel projects. Click to open and edit.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500">
            No projects assigned to you yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/user/projects/${project.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      {project.fileName}
                    </span>
                    <span className="text-xs text-gray-400">
                      Updated {new Date(project.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
