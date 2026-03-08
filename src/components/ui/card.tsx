import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6",
        variant === "default" &&
          "bg-white/65 backdrop-blur-xl border border-white/40 shadow-sm shadow-black/[0.04]",
        variant === "glass" &&
          "bg-white/50 backdrop-blur-xl border border-white/30 shadow-sm shadow-black/[0.04]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
