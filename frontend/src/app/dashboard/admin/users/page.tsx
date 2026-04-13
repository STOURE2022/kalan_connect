"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState, useCallback } from "react";
import {
  Search, Filter, UserCheck, UserX, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, Calendar, Shield, MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminUser {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_phone_verified: boolean;
  is_active: boolean;
  has_active_subscription: boolean;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  parent:   { label: "Parent",     color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  teacher:  { label: "Professeur", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  student:  { label: "Élève",      color: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  etudiant: { label: "Étudiant",   color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  admin:    { label: "Admin",      color: "bg-primary-500/15 text-primary-400 border-primary-500/20" },
};

const ROLES = ["all", "parent", "teacher", "student", "etudiant", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const token = () => getAccessToken();
  const api = (p: string) => `${process.env.NEXT_PUBLIC_API_URL}${p}`;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      params.set("page", String(page));
      const res = await fetch(api(`/admin/users/?${params}`), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      } else {
        setUsers(data.results ?? []);
        setTotal(data.count ?? 0);
      }
    } catch { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      await fetch(api(`/admin/users/${user.id}/toggle-active/`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success(user.is_active ? "Compte désactivé" : "Compte activé");
      setUsers((p) => p.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch { toast.error("Erreur"); }
    finally { setTogglingId(null); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Utilisateurs</h1>
          <p className="text-xs text-white/30 mt-0.5">{total} comptes inscrits</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom, téléphone..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-primary-500/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`flex-shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                roleFilter === r
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              }`}
            >
              {r === "all" ? "Tous" : ROLE_CONFIG[r]?.label ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#13151f] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Inscription</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/30 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map((j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-white/20">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : users.map((user) => {
                const role = ROLE_CONFIG[user.role] ?? { label: user.role, color: "bg-white/10 text-white/50 border-white/10" };
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/30 to-emerald-500/30 text-xs font-bold text-white">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.first_name} {user.last_name}</p>
                          {user.has_active_subscription && (
                            <span className="text-[10px] text-primary-400 font-semibold">● Abonné</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-xs text-white/50">
                          <Phone size={10} className="text-white/20" /> {user.phone}
                        </p>
                        {user.email && (
                          <p className="flex items-center gap-1.5 text-xs text-white/30 truncate max-w-[160px]">
                            <Mail size={10} className="text-white/20" /> {user.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${role.color}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-white/40">
                        {new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-primary-400" : "bg-red-500"}`} />
                        <span className={`text-xs font-semibold ${user.is_active ? "text-primary-400" : "text-red-400"}`}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </span>
                        {user.is_phone_verified && (
                          <span title="Téléphone vérifié"><Shield size={11} className="text-blue-400 ml-1" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={togglingId === user.id}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ml-auto ${
                          user.is_active
                            ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border-primary-500/20 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20"
                        }`}
                      >
                        {user.is_active ? <UserX size={11} /> : <UserCheck size={11} />}
                        {togglingId === user.id ? "..." : user.is_active ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <p className="text-xs text-white/30">
              Page {page} / {totalPages} · {total} résultats
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:border-white/20 hover:text-white/60 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:border-white/20 hover:text-white/60 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
