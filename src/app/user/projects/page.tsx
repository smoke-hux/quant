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

const statusConfig: Record<string, { color: string; border: string; bg: string; label: string }> = {
  PENDING: {
    color: "text-amber-700",
    border: "border-l-amber-400",
    bg: "bg-amber-50 text-amber-700",
    label: "Pending",
  },
  IN_PROGRESS: {
    color: "text-blue-700",
    border: "border-l-blue-500",
    bg: "bg-blue-50 text-blue-700",
    label: "In Progress",
  },
  COMPLETED: {
    color: "text-green-700",
    border: "border-l-green-500",
    bg: "bg-green-50 text-green-700",
    label: "Completed",
  },
};

function SkeletonProjects() {
  return (
    <div className="max-w-4xl page-enter">
      <div className="mb-6">
        <div className="skeleton skeleton-title w-40" />
        <div className="skeleton skeleton-text w-72" />
      </div>
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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
    return <SkeletonProjects />;
  }

  return (
    <div className="max-w-4xl page-enter">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
        <p className="text-gray-500 mt-1">
          Your assigned Excel projects. Click to open and edit.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center card-enter">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">No projects yet</p>
          <p className="text-sm text-gray-400">
            Projects assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project, i) => {
            const config = statusConfig[project.status] || statusConfig.PENDING;
            return (
              <Link
                key={project.id}
                href={`/user/projects/${project.id}`}
                className={`block bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${config.border} p-6 hover:shadow-md hover:border-gray-300 transition-all card-enter hover-lift`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* File icon */}
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          {project.fileName}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(project.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} flex-shrink-0`}
                  >
                    {config.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
