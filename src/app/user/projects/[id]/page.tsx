"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SpreadsheetEditor } from "@/components/spreadsheet-editor";

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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load project");
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
    <div className="h-[calc(100vh-8rem)] -m-8 flex flex-col">
      {/* Back button */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
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
      </div>
      <div className="flex-1 overflow-hidden">
        <SpreadsheetEditor
          projectId={project.id}
          projectName={project.name}
          fileDataBase64={project.fileData}
          fileName={project.fileName}
        />
      </div>
    </div>
  );
}
