import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  email?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "idle" | "offline";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const statusDots = {
  online: "bg-green-500",
  idle: "bg-amber-500",
  offline: "bg-gray-400",
};

export function Avatar({ name, email, size = "md", status, className }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (email ?? "?")[0].toUpperCase();

  return (
    <div className={cn("relative inline-flex flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-semibold text-blue-700",
          sizes[size]
        )}
      >
        {initials}
      </div>
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            statusDots[status]
          )}
        />
      )}
    </div>
  );
}
