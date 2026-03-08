"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SpreadsheetEditor } from "@/components/spreadsheet-editor";
import { DocumentsPanel } from "@/components/documents-panel";

interface Project {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  fileData: string; // base64
  status: string;
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDocs, setShowDocs] = useState(false);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load project");
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
        // Log project open for admin activity tracking
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "PROJECT_OPEN", details: data.name }),
        }).catch(() => {});
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  // Fetch document count for the badge
  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/projects/${params.id}/documents`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDocCount(data.length);
      })
      .catch(() => {});
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading spreadsheet...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-red-500">{error || "Project not found"}</div>
        <button
          onClick={() => router.push("/user/projects")}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] -m-4 lg:-m-8 flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={() => router.push("/user/projects")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to projects
        </button>
        <button
          onClick={() => setShowDocs(!showDocs)}
          className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            showDocs
              ? "bg-blue-50 text-blue-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Documents
          {docCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {docCount}
            </span>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden">
          <SpreadsheetEditor
            projectId={project.id}
            projectName={project.name}
            fileDataBase64={project.fileData}
            fileName={project.fileName}
          />
        </div>
        {showDocs && (
          <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-auto lg:w-80 lg:flex-shrink-0">
            {/* Mobile backdrop */}
            <div
              className="absolute inset-0 bg-black/50 lg:hidden"
              onClick={() => setShowDocs(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full border-l border-gray-200 bg-white overflow-y-auto lg:static lg:w-full">
              <DocumentsPanel
                projectId={project.id}
                projectName={project.name}
                isAdmin={session?.user?.role === "ADMIN"}
                currentUserId={session?.user?.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
