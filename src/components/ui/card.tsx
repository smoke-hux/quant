import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        variant === "default" && "bg-white border-gray-200 shadow-sm",
        variant === "glass" &&
          "bg-white/80 backdrop-blur-sm border-gray-200/60 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
