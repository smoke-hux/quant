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
  userName?: string;
}

export function Sidebar({ links, title, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail
      ? userEmail[0].toUpperCase()
      : "?";

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
      {/* Gradient branded header */}
      <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Trumpet Courts</h1>
              <p className="text-[11px] text-blue-200/80 font-medium">{title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {/* Active left border indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full" />
              )}
              <span className={cn(
                "transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3">
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            {userName && (
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            )}
            {userEmail && (
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
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
