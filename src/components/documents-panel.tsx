"use client";

import { useEffect, useState, useRef } from "react";

interface DocumentUser {
  id: string;
  name: string | null;
  email: string;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: DocumentUser;
}

interface DocumentsPanelProps {
  projectId: string;
  projectName: string;
  isAdmin?: boolean;
  currentUserId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fileTypeConfig: Record<string, { color: string; bg: string; label: string }> = {
  xlsx: { color: "text-green-600", bg: "bg-green-50", label: "Excel" },
  xls: { color: "text-green-600", bg: "bg-green-50", label: "Excel" },
  csv: { color: "text-green-600", bg: "bg-green-50", label: "CSV" },
  pdf: { color: "text-red-600", bg: "bg-red-50", label: "PDF" },
  docx: { color: "text-blue-600", bg: "bg-blue-50", label: "Word" },
  doc: { color: "text-blue-600", bg: "bg-blue-50", label: "Word" },
  txt: { color: "text-gray-600", bg: "bg-gray-50", label: "Text" },
  png: { color: "text-purple-600", bg: "bg-purple-50", label: "Image" },
  jpg: { color: "text-purple-600", bg: "bg-purple-50", label: "Image" },
  jpeg: { color: "text-purple-600", bg: "bg-purple-50", label: "Image" },
  zip: { color: "text-amber-600", bg: "bg-amber-50", label: "ZIP" },
};

function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  const config = fileTypeConfig[fileType] || { color: "text-gray-600", bg: "bg-gray-50" };
  return (
    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 ${className || ""}`}>
      <svg className={`w-4 h-4 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  );
}

export function DocumentsPanel({ projectId, projectName, isAdmin, currentUserId }: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fetchDocuments() {
    fetch(`/api/projects/${projectId}/documents`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load documents");
        return r.json();
      })
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        fetchDocuments();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    setDownloadingId(docId);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}`);
      if (!res.ok) throw new Error("Download failed");
      const data = await res.json();

      const byteCharacters = atob(data.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed");
      } else {
        fetchDocuments();
      }
    } catch {
      setError("Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-24 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Documents ({documents.length})
        </h3>
        <label className="cursor-pointer px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200/50 flex items-center gap-1.5">
          {uploading ? (
            <>
              <div className="spinner-sm" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.zip"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-xs text-gray-400">No documents yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Upload files to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const config = fileTypeConfig[doc.fileType] || { color: "text-gray-600", bg: "bg-gray-50", label: doc.fileType };
            const canDelete = isAdmin || doc.uploadedBy.id === currentUserId;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
              >
                <FileTypeIcon fileType={doc.fileType} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                    {doc.fileName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>&middot;</span>
                    <span>{doc.uploadedBy.name || doc.uploadedBy.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                    disabled={downloadingId === doc.id}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Download"
                  >
                    {downloadingId === doc.id ? (
                      <div className="spinner-sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    )}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
