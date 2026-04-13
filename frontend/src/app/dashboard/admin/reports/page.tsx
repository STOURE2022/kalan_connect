"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState, useCallback } from "react";
import { Flag, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

interface AdminReport {
  id: number;
  reporter: { id: number; first_name: string; last_name: string };
  reported_user: { id: number; first_name: string; last_name: string };
  booking: number | null;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  bad_behavior:  "Mauvais comportement",
  no_show:       "Absence",
  inappropriate: "Contenu inapproprié",
  fraud:         "Fraude",
  low_quality:   "Qualité insuffisante",
  other:         "Autre",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  color: "bg-amber-500/10 border-amber-500/20 text-amber-400",   icon: Clock },
  reviewed:  { label: "En cours",    color: "bg-blue-500/10 border-blue-500/20 text-blue-400",      icon: Eye },
  resolved:  { label: "Résolu",      color: "bg-primary-500/10 border-primary-500/20 text-primary-400", icon: CheckCircle2 },
  dismissed: { label: "Rejeté",      color: "bg-gray-500/10 border-gray-500/20 text-gray-400",     icon: XCircle },
};

const REASON_COLORS: Record<string, string> = {
  bad_behavior:  "text-red-400",
  no_show:       "text-amber-400",
  inappropriate: "text-orange-400",
  fraud:         "text-red-500",
  low_quality:   "text-yellow-400",
  other:         "text-white/40",
};

const STATUS_TABS = ["all", "pending", "reviewed", "resolved", "dismissed"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const token = () => getAccessToken();
  const api = (p: string) => `${process.env.NEXT_PUBLIC_API_URL}${p}`;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(api(`/admin/reports/?${params}`), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      const list: AdminReport[] = Array.isArray(data) ? data : (data.results ?? []);
      setReports(list);
      const initNotes: Record<number, string> = {};
      list.forEach((r) => { initNotes[r.id] = r.admin_notes ?? ""; });
      setNotes(initNotes);
    } catch { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateReport = async (id: number, status: string) => {
    setSavingId(id);
    try {
      const res = await fetch(api(`/admin/reports/${id}/`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status, admin_notes: notes[id] ?? "" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Signalement mis à jour");
      setReports((p) => p.map((r) => r.id === id ? { ...r, status: status as AdminReport["status"], admin_notes: notes[id] ?? "" } : r));
      setExpanded(null);
    } catch { toast.error("Erreur"); }
    finally { setSavingId(null); }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Signalements</h1>
          <p className="text-xs text-white/30 mt-0.5">{pendingCount} en attente de traitement</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              statusFilter === s
                ? "bg-primary-500 border-primary-500 text-white"
                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
            }`}
          >
            {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#13151f] border border-white/5 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10">
            <Flag size={28} className="text-primary-400" />
          </div>
          <p className="font-bold text-white">Aucun signalement {statusFilter !== "all" ? STATUS_CONFIG[statusFilter]?.label?.toLowerCase() : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isExp = expanded === report.id;
            return (
              <div key={report.id} className="rounded-2xl bg-[#13151f] border border-white/5 overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(isExp ? null : report.id)}>
                  {/* Reason icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <Flag size={15} className="text-red-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${REASON_COLORS[report.reason] ?? "text-white/50"}`}>
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                        <StatusIcon size={9} className="inline mr-0.5" />{cfg.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">
                      Signalé par <span className="text-white/60 font-semibold">{report.reporter.first_name} {report.reporter.last_name}</span>
                      {" → "}
                      <span className="text-white/60 font-semibold">{report.reported_user.first_name} {report.reported_user.last_name}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/25">
                      {new Date(report.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <button className="text-white/30 hover:text-white/50 flex-shrink-0">
                    {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isExp && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-4 space-y-4">
                    {report.description && (
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs font-semibold text-white/30 mb-1">Description</p>
                        <p className="text-sm text-white/60 leading-relaxed">{report.description}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-white/30 mb-1.5">Notes admin</label>
                      <textarea
                        value={notes[report.id] ?? ""}
                        onChange={(e) => setNotes((p) => ({ ...p, [report.id]: e.target.value }))}
                        placeholder="Vos notes internes sur ce signalement..."
                        rows={2}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-primary-500/40 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["reviewed", "resolved", "dismissed"].map((s) => {
                        const sCfg = STATUS_CONFIG[s];
                        const SIcon = sCfg.icon;
                        return (
                          <button
                            key={s}
                            onClick={() => updateReport(report.id, s)}
                            disabled={savingId === report.id || report.status === s}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 ${sCfg.color}`}
                          >
                            <SIcon size={11} />
                            {savingId === report.id ? "..." : sCfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
