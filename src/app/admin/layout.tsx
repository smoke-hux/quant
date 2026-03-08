"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast-provider";
import {
  LayoutDashboard,
  Clock,
  Users,
  FolderOpen,
  ClipboardList,
  KeyRound,
  Menu,
} from "lucide-react";

const adminLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: "/admin/schedule",
    label: "Schedule",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    href: "/admin/activity",
    label: "Activity Log",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: "/admin/access-requests",
    label: "Access Requests",
    icon: <KeyRound className="w-5 h-5" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/user/projects");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-gray-400 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar
          links={adminLinks}
          title="Admin Panel"
          userEmail={session?.user?.email}
          userName={session?.user?.name}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/30 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-sm font-semibold text-gray-900">Trumpet Courts</h1>
            <span className="text-xs text-gray-400 font-medium">Admin</span>
          </div>
          <main className="flex-1 p-4 lg:p-8 page-enter">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
