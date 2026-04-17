"use client";

import { useEffect, useState } from "react";
import {
  Trophy, Plus, Pencil, Trash2, Eye, EyeOff,
  RefreshCw, X, Save, CalendarDays, AlertTriangle,
} from "lucide-react";
import { getAccessToken } from "@/lib/api";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const tok = () => getAccessToken() ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConcoursType = "BAC" | "BEPC" | "ENI" | "CAT" | "ENA" | "ENAM" | "FMPOS" | "other";

interface ConcoursEvent {
  id: number;
  type: ConcoursType;
  type_display: string;
  title: string;
  year: number;
  date_inscription_limite: string | null;
  date_examen: string;
  description: string;
  is_active: boolean;
  days_until_inscription: number | null;
  days_until_examen: number;
}

const TYPES: { value: ConcoursType; label: string }[] = [
  { value: "BAC",   label: "BAC — Baccalauréat" },
  { value: "BEPC",  label: "BEPC" },
  { value: "ENI",   label: "ENI — École Nationale d'Ingénieurs" },
  { value: "CAT",   label: "CAT — Certificat d'Aptitude à l'Enseignement" },
  { value: "ENA",   label: "ENA — École Nationale d'Administration" },
  { value: "ENAM",  label: "ENAM" },
  { value: "FMPOS", label: "FMPOS — Faculté de Médecine" },
  { value: "other", label: "Autre" },
];

const TYPE_COLORS: Record<string, string> = {
  BAC:   "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  BEPC:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ENI:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CAT:   "bg-violet-500/20 text-violet-300 border-violet-500/30",
  ENA:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ENAM:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  FMPOS: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  other: "bg-white/10 text-white/50 border-white/20",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function DaysChip({ days }: { days: number }) {
  if (days < 0)   return <span className="text-xs text-white/20">Passé</span>;
  if (days === 0) return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-black text-red-400">Aujourd&apos;hui !</span>;
  if (days <= 1)  return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-black text-red-400">J-1 !</span>;
  if (days <= 7)  return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">J-{days}</span>;
  if (days <= 30) return <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-400">J-{days}</span>;
  return <span className="text-xs text-white/30">J-{days}</span>;
}

// ── Formulaire (création + édition) ───────────────────────────────────────────

const EMPTY_FORM = {
  type: "BAC" as ConcoursType,
  title: "",
  year: new Date().getFullYear(),
  date_inscription_limite: "",
  date_examen: "",
  description: "",
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

function EventForm({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-3">
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1d2e] border border-white/10 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy size={15} className="text-amber-400" />
            {initial.title ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Type + Année */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Type *</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as ConcoursType)}
                className="w-full rounded-xl border border-white/10 bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Année *</label>
              <input
                type="number"
                min={2020}
                max={2040}
                value={form.year}
                onChange={(e) => set("year", Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="ex: Baccalauréat série D — Mali"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Limite inscription
              </label>
              <input
                type="date"
                value={form.date_inscription_limite}
                onChange={(e) => set("date_inscription_limite", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Date examen *
              </label>
              <input
                type="date"
                value={form.date_examen}
                onChange={(e) => set("date_examen", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Informations complémentaires (optionnel)"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Actif */}
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => set("is_active", !form.is_active)}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-amber-500" : "bg-white/20"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-white/70">
              Événement actif (visible et déclenche des alertes)
            </span>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || !form.title || !form.date_examen}
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function AdminConcoursPage() {
  const [events, setEvents]         = useState<ConcoursEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<ConcoursEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConcoursEvent | null>(null);
  const [filter, setFilter]         = useState<"all" | "active" | "inactive">("all");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/concours/`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setEvents(await r.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: FormState) => {
    setSaving(true);
    try {
      const url    = editing ? `${API}/admin/concours/${editing.id}/` : `${API}/admin/concours/`;
      const method = editing ? "PATCH" : "POST";
      const payload = {
        ...data,
        date_inscription_limite: data.date_inscription_limite || null,
      };
      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(editing ? "Événement mis à jour !" : "Événement créé !");
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (event: ConcoursEvent) => {
    try {
      const r = await fetch(`${API}/admin/concours/${event.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !event.is_active }),
      });
      if (!r.ok) throw new Error();
      setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, is_active: !e.is_active } : e));
      toast.success(event.is_active ? "Événement désactivé" : "Événement activé");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch(`${API}/admin/concours/${confirmDelete.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tok()}` },
      });
      toast.success("Événement supprimé");
      setConfirmDelete(null);
      setEvents((prev) => prev.filter((e) => e.id !== confirmDelete.id));
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEdit = (event: ConcoursEvent) => {
    setEditing(event);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const formInitial: FormState = editing
    ? {
        type: editing.type,
        title: editing.title,
        year: editing.year,
        date_inscription_limite: editing.date_inscription_limite ?? "",
        date_examen: editing.date_examen,
        description: editing.description,
        is_active: editing.is_active,
      }
    : EMPTY_FORM;

  const displayed = events.filter((e) =>
    filter === "all" ? true : filter === "active" ? e.is_active : !e.is_active
  );

  const activeCount   = events.filter((e) =>  e.is_active).length;
  const inactiveCount = events.filter((e) => !e.is_active).length;
  const urgentCount   = events.filter((e) =>  e.is_active && e.days_until_examen <= 7).length;

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40">Administration</p>
          <h1 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            Calendrier Concours
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={14} className={`text-white/50 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Actifs",    value: activeCount,   color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Inactifs",  value: inactiveCount, color: "text-white/40",     bg: "bg-white/5 border-white/10" },
          { label: "Urgents ≤7j", value: urgentCount, color: "text-red-400",      bg: "bg-red-500/10 border-red-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
            }`}
          >
            {f === "all" ? `Tous (${events.length})` : f === "active" ? `Actifs (${activeCount})` : `Inactifs (${inactiveCount})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#13151f]">
        {loading ? (
          <div className="space-y-px">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CalendarDays size={32} className="text-white/10 mb-3" />
            <p className="text-sm text-white/30">Aucun événement</p>
            <button onClick={openCreate} className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors">
              <Plus size={13} /> Ajouter le premier
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/30">Concours</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/30 hidden md:table-cell">Inscription</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/30">Examen</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white/30">Délai</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white/30">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/30">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayed.map((event) => {
                const colorCls = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;
                return (
                  <tr key={event.id} className={`transition-colors hover:bg-white/[0.02] ${!event.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${colorCls}`}>
                          {event.type}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-white leading-tight truncate max-w-[160px]">{event.title}</p>
                          <p className="text-[11px] text-white/30">{event.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-white/50">
                        {event.date_inscription_limite ? fmt(event.date_inscription_limite) : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-white">{fmt(event.date_examen)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <DaysChip days={event.days_until_examen} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(event)}
                        title={event.is_active ? "Désactiver" : "Activer"}
                        className="transition-opacity hover:opacity-80"
                      >
                        {event.is_active
                          ? <Eye size={15} className="text-emerald-400" />
                          : <EyeOff size={15} className="text-white/20" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(event)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(event)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modale formulaire */}
      {showForm && (
        <EventForm
          initial={formInitial}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {/* Modale confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1d2e] border border-white/10 p-5 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Supprimer cet événement ?</p>
                <p className="text-xs text-white/50 mt-1">
                  <span className="font-semibold text-white/70">{confirmDelete.title}</span> sera définitivement supprimé.
                  Les abonnés ne recevront plus d&apos;alertes pour ce concours.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
