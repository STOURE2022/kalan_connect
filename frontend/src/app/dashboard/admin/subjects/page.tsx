"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  BookOpen, Search, X, Check, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface Subject {
  id: number;
  name: string;
  slug: string;
  icon: string;
  category: string;
  is_active: boolean;
  teacher_count: number;
}

const CATEGORIES = [
  { value: "sciences",    label: "Sciences"      },
  { value: "lettres",     label: "Lettres"        },
  { value: "langues",     label: "Langues"        },
  { value: "arts",        label: "Arts"           },
  { value: "informatique",label: "Informatique"   },
  { value: "autre",       label: "Autre"          },
];

const CAT_COLORS: Record<string, string> = {
  sciences:     "bg-blue-100 text-blue-700",
  lettres:      "bg-primary-100 text-primary-700",
  langues:      "bg-purple-100 text-purple-700",
  arts:         "bg-pink-100 text-pink-700",
  informatique: "bg-indigo-100 text-indigo-700",
  autre:        "bg-gray-100 text-gray-600",
};

function apiFetch(path: string, options?: RequestInit) {
  const token = getAccessToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
}

export default function AdminSubjectsPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isAdmin } = useAuth();

  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [query, setQuery]         = useState("");
  const [saving, setSaving]       = useState(false);

  // Form state
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState({ name: "", category: "autre", icon: "" });

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isAdmin)) router.push("/auth/login");
  }, [loading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadSubjects();
  }, [isLoggedIn]);

  function loadSubjects() {
    setFetching(true);
    apiFetch("/admin/subjects/")
      .then((r) => r.json())
      .then(setSubjects)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setFetching(false));
  }

  function openCreate() {
    setEditId(null);
    setForm({ name: "", category: "autre", icon: "" });
    setShowForm(true);
  }

  function openEdit(s: Subject) {
    setEditId(s.id);
    setForm({ name: s.name, category: s.category, icon: s.icon ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Le nom est requis");
    setSaving(true);
    try {
      const res = editId
        ? await apiFetch(`/admin/subjects/${editId}/`, {
            method: "PATCH",
            body: JSON.stringify({ name: form.name, category: form.category, icon: form.icon }),
          })
        : await apiFetch("/admin/subjects/", {
            method: "POST",
            body: JSON.stringify({ name: form.name, category: form.category, icon: form.icon }),
          });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.name?.[0] ?? err.detail ?? "Erreur");
      }
      toast.success(editId ? "Matière modifiée" : "Matière créée");
      setShowForm(false);
      loadSubjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Subject) {
    try {
      const res = await apiFetch(`/admin/subjects/${s.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (!res.ok) throw new Error();
      setSubjects((prev) => prev.map((x) => x.id === s.id ? { ...x, is_active: !s.is_active } : x));
      toast.success(s.is_active ? "Matière désactivée" : "Matière activée");
    } catch {
      toast.error("Erreur lors de la modification");
    }
  }

  async function handleDelete(s: Subject) {
    if (!confirm(`Supprimer "${s.name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await apiFetch(`/admin/subjects/${s.id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSubjects((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Matière supprimée");
    } catch {
      toast.error("Impossible de supprimer (des profs l'utilisent peut-être)");
    }
  }

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <button onClick={() => router.push("/dashboard/admin")} className="hover:text-gray-600">
              <ChevronLeft size={15} className="inline" /> Dashboard
            </button>
          </div>
          <h1 className="text-xl font-black text-gray-900">Gestion des matières</h1>
          <p className="text-sm text-gray-400 mt-0.5">{subjects.length} matière{subjects.length > 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> Ajouter une matière
        </button>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              {editId ? "Modifier la matière" : "Nouvelle matière"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ex: Mathématiques"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>
            <div className="min-w-[150px]">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Icône (optionnel)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="ex: book-open"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-60 transition-colors"
            >
              {saving
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Check size={14} />}
              {editId ? "Enregistrer" : "Créer"}
            </button>
          </form>
        </div>
      )}

      {/* Barre recherche */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une matière..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {fetching ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
          <BookOpen size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">
            {query ? "Aucune matière trouvée" : "Aucune matière"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 text-left">Matière</th>
                <th className="px-5 py-3 text-left">Catégorie</th>
                <th className="px-5 py-3 text-center">Profs</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className={`transition-colors hover:bg-gray-50 ${!s.is_active ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                        <BookOpen size={14} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-[11px] text-gray-400">{s.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${CAT_COLORS[s.category] ?? CAT_COLORS.autre}`}>
                      {CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="font-semibold text-gray-700">{s.teacher_count}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => toggleActive(s)}
                      title={s.is_active ? "Désactiver" : "Activer"}
                      className="transition-transform hover:scale-110"
                    >
                      {s.is_active
                        ? <ToggleRight size={24} className="text-primary-500" />
                        : <ToggleLeft size={24} className="text-gray-300" />
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Supprimer"
                        disabled={s.teacher_count > 0}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
