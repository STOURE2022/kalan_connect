"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState, useCallback } from "react";
import { Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Monitor, Home, User as UserIcon } from "lucide-react";

interface AdminBooking {
  id: number;
  parent: { id: number; first_name: string; last_name: string };
  teacher_name: string;
  subject_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string;
  price: number;
  notes: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock        },
  confirmed: { label: "Confirmé",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     icon: CheckCircle2 },
  completed: { label: "Terminé",     dot: "bg-primary-400", text: "text-primary-400", bg: "bg-primary-500/10 border-primary-500/20", icon: CheckCircle2 },
  cancelled: { label: "Annulé",      dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       icon: XCircle      },
  no_show:   { label: "Absent",      dot: "bg-gray-500",    text: "text-gray-400",    bg: "bg-gray-500/10 border-gray-500/20",     icon: XCircle      },
};

const LOC_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  online:     { label: "En ligne",       icon: Monitor  },
  at_teacher: { label: "Chez le prof",   icon: Home     },
  at_student: { label: "À domicile",     icon: UserIcon },
};

const STATUS_TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  const token = () => getAccessToken();
  const api = (p: string) => `${process.env.NEXT_PUBLIC_API_URL}${p}`;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      const res = await fetch(api(`/admin/bookings/?${params}`), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      const all: AdminBooking[] = Array.isArray(data) ? data : (data.results ?? []);
      setTotal(data.count ?? all.length);
      setBookings(all);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = search
    ? bookings.filter((b) =>
        b.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
        `${b.parent.first_name} ${b.parent.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Réservations</h1>
          <p className="text-xs text-white/30 mt-0.5">{total} réservations au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher prof, élève, matière..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-primary-500/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`flex-shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              }`}
            >
              {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
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
                {["Date", "Élève → Prof", "Matière", "Lieu", "Prix", "Statut"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-white/5 animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-white/20">Aucune réservation</td></tr>
              ) : filtered.map((b) => {
                const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const locCfg = LOC_CONFIG[b.location_type];
                const LocIcon = locCfg?.icon ?? UserIcon;
                const d = b.date ? new Date(b.date) : null;
                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {d ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-white/5 text-center">
                            <p className="text-sm font-black text-white leading-none">{d.getDate()}</p>
                            <p className="text-[9px] text-white/30 uppercase">{MONTHS_FR[d.getMonth()]}</p>
                          </div>
                          <p className="text-xs text-white/40">{b.start_time?.slice(0,5)}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-white">{b.parent.first_name} {b.parent.last_name}</p>
                      <p className="text-xs text-white/30">{b.teacher_name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-white/70">{b.subject_name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <LocIcon size={11} /> {locCfg?.label ?? b.location_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-bold text-white">{b.price?.toLocaleString()} F</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold w-fit ${cfg.bg} ${cfg.text}`}>
                        <StatusIcon size={9} /> {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <p className="text-xs text-white/30">Page {page} / {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1} className="rounded-lg border border-white/10 p-1.5 text-white/40 disabled:opacity-30 hover:border-white/20"><ChevronLeft size={14}/></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages} className="rounded-lg border border-white/10 p-1.5 text-white/40 disabled:opacity-30 hover:border-white/20"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
