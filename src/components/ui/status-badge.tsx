import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { bg: string; text: string; dot?: string }> = {
  // Project/request statuses
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  DENIED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  // Activity actions
  LOGIN: { bg: "bg-green-100", text: "text-green-700" },
  LOGOUT: { bg: "bg-gray-100", text: "text-gray-700" },
  FILE_UPLOAD: { bg: "bg-blue-100", text: "text-blue-700" },
  FILE_EDIT: { bg: "bg-amber-100", text: "text-amber-700" },
  FILE_DOWNLOAD: { bg: "bg-purple-100", text: "text-purple-700" },
  PROJECT_OPEN: { bg: "bg-indigo-100", text: "text-indigo-700" },
  // Roles
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700" },
  USER: { bg: "bg-gray-100", text: "text-gray-600" },
  // Online statuses
  online: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  idle: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  offline: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot, className }: StatusBadgeProps) {
  const style = STATUS_MAP[status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        style.bg,
        style.text,
        className
      )}
    >
      {showDot && style.dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      )}
      {label}
    </span>
  );
}
