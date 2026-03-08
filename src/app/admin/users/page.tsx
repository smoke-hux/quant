"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  X,
  BarChart3,
  AlertCircle,
  Clock,
  Shield,
  ShieldOff,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast-provider";
import { timeAgo } from "@/lib/time-utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  tempAdminUntil: string | null;
}

const TEMP_DURATIONS = [
  { label: "2h", hours: 2 },
  { label: "4h", hours: 4 },
  { label: "8h", hours: 8 },
  { label: "24h", hours: 24 },
];

function formatTimeRemaining(until: string): string {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function SkeletonUsers() {
  return (
    <div className="max-w-6xl page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-title w-32" />
          <div className="skeleton skeleton-text w-56" />
        </div>
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>
      <div className="bg-white/65 backdrop-blur-xl rounded-xl shadow-sm shadow-black/[0.04] border border-white/40 overflow-hidden">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton skeleton-avatar" />
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-text w-40" />
                <div className="skeleton skeleton-text w-56" style={{ height: "0.75rem" }} />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "ADMIN" | "USER">("all");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [createError, setCreateError] = useState("");
  const [grantingTempId, setGrantingTempId] = useState<string | null>(null);
  const [confirmingPromoteId, setConfirmingPromoteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  function fetchUsers() {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleRoleChange(userId: string, userName: string | null, newRole: string) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      toast({
        title: newRole === "ADMIN"
          ? `${userName || "User"} is now a Full Admin with complete access`
          : `${userName || "User"} demoted to regular User`,
        variant: "success",
      });
      setConfirmingPromoteId(null);
      fetchUsers();
    } else {
      const data = await res.json().catch(() => null);
      toast({ title: data?.error || "Failed to update role", variant: "error" });
    }
  }

  async function handleGrantTempAdmin(userId: string, hours: number) {
    const res = await fetch("/api/users/temp-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, hours }),
    });
    if (res.ok) {
      toast({ title: `Temp admin granted for ${hours}h`, variant: "success" });
      setGrantingTempId(null);
      fetchUsers();
    } else {
      const data = await res.json();
      toast({ title: data.error || "Failed to grant temp admin", variant: "error" });
    }
  }

  async function handleRevokeTempAdmin(userId: string) {
    const res = await fetch("/api/users/temp-admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast({ title: "Temp admin revoked", variant: "success" });
      fetchUsers();
    } else {
      toast({ title: "Failed to revoke temp admin", variant: "error" });
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!res.ok) {
      const data = await res.json();
      setCreateError(data.error || "Failed to create user");
      return;
    }

    toast({ title: `User "${newUser.name}" created`, variant: "success" });
    setShowCreate(false);
    setNewUser({ name: "", email: "", password: "", role: "USER" });
    fetchUsers();
  }

  if (loading) {
    return <SkeletonUsers />;
  }

  // Filter logic
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  const roleTabs = [
    { key: "all" as const, label: "All Users", count: users.length },
    { key: "ADMIN" as const, label: "Admins", count: adminCount },
    { key: "USER" as const, label: "Users", count: userCount },
  ];

  function renderTempAdminControls(user: User) {
    const isTempAdmin = user.role === "ADMIN" && !!user.tempAdminUntil;
    const isPermanentAdmin = user.role === "ADMIN" && !user.tempAdminUntil;

    // Show temp admin badge + revoke for active temp admins
    if (isTempAdmin) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            TEMP {formatTimeRemaining(user.tempAdminUntil!)}
          </span>
          <button
            onClick={() => handleRevokeTempAdmin(user.id)}
            className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Revoke
          </button>
        </div>
      );
    }

    // Show temp admin grant UI for regular users
    if (user.role === "USER") {
      if (grantingTempId === user.id) {
        return (
          <div className="flex items-center gap-1.5">
            {TEMP_DURATIONS.map((d) => (
              <button
                key={d.hours}
                onClick={() => handleGrantTempAdmin(user.id, d.hours)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors"
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setGrantingTempId(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
      return (
        <button
          onClick={() => setGrantingTempId(user.id)}
          className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          Temp Admin
        </button>
      );
    }

    // Permanent admins — no temp admin option
    return null;
  }

  function renderTempAdminControlsMobile(user: User) {
    const isTempAdmin = user.role === "ADMIN" && !!user.tempAdminUntil;

    if (isTempAdmin) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-2.5 h-2.5" />
            TEMP {formatTimeRemaining(user.tempAdminUntil!)}
          </span>
          <button
            onClick={() => handleRevokeTempAdmin(user.id)}
            className="text-xs text-red-600 font-medium flex items-center gap-1 cursor-pointer"
          >
            <ShieldOff className="w-3 h-3" />
            Revoke
          </button>
        </div>
      );
    }

    if (user.role === "USER") {
      if (grantingTempId === user.id) {
        return (
          <div className="flex items-center gap-1 mt-2">
            {TEMP_DURATIONS.map((d) => (
              <button
                key={d.hours}
                onClick={() => handleGrantTempAdmin(user.id, d.hours)}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors"
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setGrantingTempId(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }
      return (
        <button
          onClick={() => setGrantingTempId(user.id)}
          className="text-xs text-purple-600 font-medium flex items-center gap-1 cursor-pointer"
        >
          <Shield className="w-3 h-3" />
          Temp
        </button>
      );
    }

    return null;
  }

  return (
    <div className="max-w-6xl page-enter">
      <PageHeader
        title="Users"
        description="Manage user accounts and roles."
        badge={{ label: "TEAM", icon: Users }}
        count={users.length}
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200/50 cursor-pointer transition-colors"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cancel" : "Add User"}
          </button>
        }
      />

      {/* Create User Form */}
      {showCreate && (
        <div className="mb-6 p-6 bg-white/65 backdrop-blur-xl rounded-xl shadow-sm shadow-black/[0.04] border border-white/40 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
          {createError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2 animate-slide-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {createError}
            </div>
          )}
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="USER">User (standard access)</option>
                <option value="ADMIN">Admin (full access)</option>
              </select>
            </div>
            {newUser.role === "ADMIN" && (
              <div className="sm:col-span-2 flex items-start gap-3 px-4 py-3 bg-blue-50/60 backdrop-blur-sm border border-blue-200/50 rounded-xl animate-fade-in-up">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Full Admin Access</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    This user will have the same permissions as you: manage users, projects, schedules, view all activity, and approve access requests. This is permanent until manually revoked.
                  </p>
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer transition-colors ${
                  newUser.role === "ADMIN"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50"
                }`}
              >
                {newUser.role === "ADMIN" ? "Create Admin" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <SearchInput
          placeholder="Search by name or email..."
          value={search}
          onChange={setSearch}
          className="w-full sm:w-72"
        />
        <div className="flex items-center gap-1.5">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                roleFilter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                roleFilter === tab.key ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable
          isEmpty={filtered.length === 0}
          empty={
            <div>
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {search ? "No users match your search." : "No users found."}
              </p>
            </div>
          }
          headers={
            <>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </>
          }
        >
          {filtered.map((user, i) => (
            <tr
              key={user.id}
              className="table-row-hover row-enter"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} email={user.email} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name || "\u2014"}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.role} />
                  {user.role === "ADMIN" && user.tempAdminUntil && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                      <Clock className="w-2.5 h-2.5" />
                      TEMP
                    </span>
                  )}
                  {user.role === "ADMIN" && !user.tempAdminUntil && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                      <Crown className="w-2.5 h-2.5" />
                      FULL
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastLogin ? timeAgo(user.lastLogin) : <span className="text-gray-300">Never</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Stats
                  </Link>
                  {renderTempAdminControls(user)}
                  {/* Permanent role change — hide if currently granting temp or user is temp admin */}
                  {grantingTempId !== user.id && !(user.role === "ADMIN" && user.tempAdminUntil) && (
                    <>
                      {confirmingPromoteId === user.id ? (
                        <div className="flex items-center gap-2 animate-fade-in-up">
                          <span className="text-xs text-gray-500">
                            {user.role === "USER" ? "Grant full admin access?" : "Remove admin access?"}
                          </span>
                          <button
                            onClick={() => handleRoleChange(user.id, user.name, user.role === "ADMIN" ? "USER" : "ADMIN")}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                              user.role === "USER"
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-orange-600 text-white hover:bg-orange-700"
                            }`}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmingPromoteId(null)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingPromoteId(user.id)}
                          className={`text-sm font-medium flex items-center gap-1 cursor-pointer ${
                            user.role === "ADMIN"
                              ? "text-orange-600 hover:text-orange-800"
                              : "text-indigo-600 hover:text-indigo-800"
                          }`}
                        >
                          {user.role === "ADMIN" ? (
                            <>
                              <ShieldOff className="w-3.5 h-3.5" />
                              Demote
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Make Admin
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/65 backdrop-blur-xl rounded-xl border border-white/40 p-8 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {search ? "No users match your search." : "No users found."}
            </p>
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={user.id}
              className="bg-white/65 backdrop-blur-xl rounded-xl border border-white/40 p-4 card-enter hover-lift"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} email={user.email} size="md" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name || "\u2014"}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
                <StatusBadge status={user.role} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {user.lastLogin ? `Last login ${timeAgo(user.lastLogin)}` : "Never logged in"}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <BarChart3 className="w-3 h-3" />
                    Stats
                  </Link>
                  {renderTempAdminControlsMobile(user)}
                  {grantingTempId !== user.id && !(user.role === "ADMIN" && user.tempAdminUntil) && (
                    <>
                      {confirmingPromoteId === user.id ? (
                        <div className="flex items-center gap-1.5 animate-fade-in-up">
                          <button
                            onClick={() => handleRoleChange(user.id, user.name, user.role === "ADMIN" ? "USER" : "ADMIN")}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-pointer transition-colors ${
                              user.role === "USER"
                                ? "bg-indigo-600 text-white"
                                : "bg-orange-600 text-white"
                            }`}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmingPromoteId(null)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingPromoteId(user.id)}
                          className={`text-xs font-medium flex items-center gap-1 cursor-pointer ${
                            user.role === "ADMIN" ? "text-orange-600" : "text-indigo-600"
                          }`}
                        >
                          {user.role === "ADMIN" ? (
                            <>
                              <ShieldOff className="w-3 h-3" />
                              Demote
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
