"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
  title: string;
  userEmail?: string;
}

export function Sidebar({ links, title, userEmail }: SidebarProps) {
  const pathname = usePathname();

  async function handleSignOut() {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOGOUT", details: "Manual sign-out" }),
      });
    } catch {
      // Best effort - proceed with sign-out even if logging fails
    }
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Quant</h1>
        <p className="text-xs text-gray-500 mt-1">{title}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {userEmail && (
          <p className="text-xs text-gray-500 mb-3 truncate">{userEmail}</p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
