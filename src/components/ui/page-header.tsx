import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    label: string;
    icon?: LucideIcon;
  };
  actions?: React.ReactNode;
  count?: number;
}

export function PageHeader({ title, description, badge, actions, count }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full mb-3">
            {badge.icon && <badge.icon className="w-3.5 h-3.5" />}
            {badge.label}
          </span>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {count !== undefined && (
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
