"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Calendar, Clock, Users, Edit3,
  XCircle, Flag, ChevronRight, Loader2, X,
} from "lucide-react";
import { sessions as sessionsApi, teachers as teachersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import type { GroupSession, Subject } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  open:      { label: "Ouvert",  dot: "bg-primary-400", text: "text-primary-700", bg: "bg-primary-50" },
  full:      { label: "Complet", dot: "bg-red-400",     text: "text-red-700",     bg: "bg-red-50"     },
  cancelled: { label: "Annulé",  dot: "bg-gray-300",    text: "text-gray-500",    bg: "bg-gray-50"    },
  completed: { label: "Terminé", dot: "bg-blue-400",    text: "text-blue-700",    bg: "bg-blue-50"    },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type FormState = {
  subject: number | "";
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location_type: string;
  address: string;
  max_participants: number;
  price_per_student: number;
};

const DEFAULT_FORM: FormState = {
  subject: "", title: "", description: "",
  date: "", start_time: "09:00", end_time: "11:00",
  location_type: "online", address: "",
  max_participants: 10, price_per_student: 0,
};

function sessionToForm(s: GroupSession): FormState {
  return {
    subject:          typeof s.subject === "object" ? s.subject.id : s.subject,
    title:            s.title,
    description:      s.description ?? "",
    date:             s.date,
    start_time:       s.start_time.slice(0, 5),
    end_time:         s.end_time.slice(0, 5),
    location_type:    s.location_type,
    address:          s.address ?? "",
    max_participants: s.max_participants,
    price_per_student: s.price_per_student,
  };
}

export default function TeacherEventsPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();

  const [items,    setItems]    = useState<GroupSession[]>([]);
  const [fetching, setFetching] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [acting,   setActing]   = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    teachersApi.getSubjects().then(setSubjects).catch(() => {});
    sessionsApi.myList()
      .then((r) => setItems(r.results ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const openEdit = (s: GroupSession) => {
    setEditingId(s.id);
    setForm(sessionToForm(s));
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.title || !form.date) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        subject:     Number(form.subject),
        description: form.description || undefined,
        address:     form.address     || undefined,
      };

      if (editingId !== null) {
        // ── Mode modification ──
        const updated = await sessionsApi.update(editingId, payload);
        setItems((prev) => prev.map((s) => s.id === editingId ? updated : s));
        toast.success("Session modifiée !");
      } else {
        // ── Mode création ──
        const created = await sessionsApi.create(payload);
        setItems((prev) => [created, ...prev]);
        toast.success("Session créée !");
      }
      closeForm();
    } catch {
      toast.error(editingId ? "Erreur lors de la modification" : "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (sessionId: number, action: "cancel" | "complete") => {
    setActing(sessionId);
    try {
      const updated = action === "cancel"
        ? await sessionsApi.cancel(sessionId)
        : await sessionsApi.complete(sessionId);
      setItems((prev) => prev.map((s) => s.id === sessionId ? updated : s));
      toast.success(action === "cancel" ? "Session annulée" : "Session marquée terminée");
    } catch {
      toast.error("Erreur");
    } finally {
      setActing(null);
    }
  };

  const f = (key: keyof FormState, val: unknown) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Mes sessions de groupe</h1>
          </div>
          <button
            onClick={showForm && !editingId ? closeForm : openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
            {showForm && !editingId ? "Annuler" : "Créer"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">

        {/* ── Formulaire création / modification ── */}
        {showForm && (
          <form onSubmit={handleSubmit} className={`rounded-2xl border bg-white p-5 shadow-sm space-y-4 ${editingId ? "border-amber-300" : "border-primary-200"}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {editingId ? "Modifier la session" : "Nouvelle session"}
              </h2>
              <button type="button" onClick={closeForm} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Titre <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => f("title", e.target.value)}
                  placeholder="Ex: Révision BAC Maths"
                  className="input text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Matière <span className="text-red-400">*</span></label>
                <select value={form.subject} onChange={(e) => f("subject", Number(e.target.value))} className="input text-sm" required>
                  <option value="">— Choisir —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Date <span className="text-red-400">*</span></label>
                <input type="date" value={form.date} onChange={(e) => f("date", e.target.value)} className="input text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Début</label>
                  <input type="time" value={form.start_time} onChange={(e) => f("start_time", e.target.value)} className="input text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Fin</label>
                  <input type="time" value={form.end_time} onChange={(e) => f("end_time", e.target.value)} className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Lieu</label>
                <select value={form.location_type} onChange={(e) => f("location_type", e.target.value)} className="input text-sm">
                  <option value="online">En ligne</option>
                  <option value="at_teacher">Chez moi</option>
                  <option value="other">Autre lieu</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Places max</label>
                <input type="number" min={2} max={50} value={form.max_participants} onChange={(e) => f("max_participants", Number(e.target.value))} className="input text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Prix par élève (FCFA)</label>
                <input type="number" min={0} step={500} value={form.price_per_student} onChange={(e) => f("price_per_student", Number(e.target.value))} className="input text-sm" />
              </div>
              {form.location_type !== "online" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Adresse</label>
                  <input value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="Adresse précise" className="input text-sm" />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => f("description", e.target.value)}
                rows={3}
                placeholder="Programme, niveau requis, matériel à apporter..."
                className="input resize-none text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
                  editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-primary-500 hover:bg-primary-600"
                }`}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving
                  ? editingId ? "Modification..." : "Création..."
                  : editingId ? "Enregistrer les modifications" : "Créer la session"
                }
              </button>
              <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* ── Liste des sessions ── */}
        {fetching ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary-400" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <Calendar size={36} className="text-gray-300" />
            <p className="mt-3 font-semibold text-gray-500">Aucune session créée</p>
            <p className="mt-1 text-sm text-gray-400">Cliquez sur "Créer" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => {
              const cfg    = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.open;
              const canAct = ["open", "full"].includes(s.status);
              const isEditing = editingId === s.id;
              return (
                <div
                  key={`session-${s.id}`}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                    isEditing ? "border-amber-300 ring-2 ring-amber-200" : "border-gray-100"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 truncate">{s.title}</h3>
                        <p className="text-xs text-gray-400">{s.subject.name}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {/* Badge statut */}
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {/* Bouton modifier (seulement si open/full) */}
                        {canAct && (
                          <button
                            onClick={() => isEditing ? closeForm() : openEdit(s)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                              isEditing
                                ? "border-amber-300 bg-amber-50 text-amber-600"
                                : "border-gray-200 bg-white text-gray-400 hover:border-primary-300 hover:text-primary-600"
                            }`}
                            title={isEditing ? "Fermer" : "Modifier"}
                          >
                            {isEditing ? <X size={13} /> : <Edit3 size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(s.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {s.participants_count}/{s.max_participants} inscrits</span>
                      <span className="font-semibold text-gray-700">
                        {s.price_per_student === 0 ? "Gratuit" : formatPrice(s.price_per_student) + "/élève"}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    {s.max_participants > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              s.spots_left === 0 ? "bg-red-500"
                              : s.participants_count / s.max_participants >= 0.7 ? "bg-amber-500"
                              : "bg-primary-500"
                            }`}
                            style={{ width: `${Math.min(100, (s.participants_count / s.max_participants) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-right text-[10px] text-gray-400">
                          {s.spots_left === 0 ? "Complet" : `${s.spots_left} place${s.spots_left > 1 ? "s" : ""} libre${s.spots_left > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3">
                    <Link href={`/events/${s.id}`} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                      Voir la page publique <ChevronRight size={12} />
                    </Link>

                    {canAct && (
                      <div className="flex gap-2">
                        <button
                          disabled={acting === s.id}
                          onClick={() => handleAction(s.id, "complete")}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          {acting === s.id ? <Loader2 size={11} className="animate-spin" /> : <Flag size={11} />}
                          Terminer
                        </button>
                        <button
                          disabled={acting === s.id}
                          onClick={() => handleAction(s.id, "cancel")}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {acting === s.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
