"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  GraduationCap,
  School,
  Calendar,
  ChevronRight,
  X,
  Check,
  Users,
  Baby,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Child, Level } from "@/types";

const CHILD_COLORS = [
  { bg: "bg-violet-500", light: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { bg: "bg-sky-500", light: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
  { bg: "bg-rose-500", light: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
];

function getAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  const finalAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  return finalAge > 0 ? `${finalAge} ans` : "";
}

function initials(child: Child): string {
  return `${child.first_name[0] ?? ""}${child.last_name[0] ?? ""}`.toUpperCase();
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  level_id: "" as string | number,
  school: "",
};

export default function ChildrenPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isParent } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && isLoggedIn && !isParent) router.push("/dashboard");
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, isParent, router]);

  const token = () => getAccessToken();
  const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

  const fetchChildren = async () => {
    try {
      const res = await fetch(api("/children/"), { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : (data.results ?? []));
    } catch { /* silent */ }
    finally { setFetching(false); }
  };

  const fetchLevels = async () => {
    try {
      const res = await fetch(api("/teachers/levels/"));
      const data = await res.json();
      setLevels(Array.isArray(data) ? data : (data.results ?? []));
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (isLoggedIn) { fetchChildren(); fetchLevels(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (child: Child) => {
    setEditingId(child.id);
    setForm({
      first_name: child.first_name,
      last_name: child.last_name,
      date_of_birth: child.date_of_birth ?? "",
      level_id: child.level?.id ?? "",
      school: child.school,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      level_id: form.level_id !== "" ? Number(form.level_id) : null,
      date_of_birth: form.date_of_birth || null,
    };
    try {
      const url = editingId ? api(`/children/${editingId}/`) : api("/children/");
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Profil mis à jour !" : "Enfant ajouté !");
      setShowForm(false);
      setEditingId(null);
      fetchChildren();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(api(`/children/${id}/`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success("Enfant supprimé");
      setChildren((p) => p.filter((c) => c.id !== id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mes enfants</h1>
              <p className="text-xs text-gray-400">{children.length} enfant{children.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary !py-2 !px-4 text-sm">
            <Plus size={14} className="mr-1 inline" /> Ajouter
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6">

        {/* Add / Edit Form */}
        {showForm && (
          <div className="mb-6 rounded-2xl border border-primary-100 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">
                {editingId ? "Modifier l'enfant" : "Ajouter un enfant"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Prénom <span className="text-red-400">*</span></label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    placeholder="Mariam"
                    className="input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Nom <span className="text-red-400">*</span></label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    placeholder="Coulibaly"
                    className="input text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Date de naissance</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                    className="input text-sm"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Niveau scolaire</label>
                  <select
                    value={form.level_id}
                    onChange={(e) => setForm((p) => ({ ...p, level_id: e.target.value }))}
                    className="input text-sm"
                  >
                    <option value="">Choisir...</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">École / Établissement</label>
                <input
                  value={form.school}
                  onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
                  placeholder="École primaire de Hamdallaye"
                  className="input text-sm"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 !py-2.5 text-sm">
                  <Check size={14} className="mr-1 inline" />
                  {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter l'enfant"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !py-2.5 text-sm">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {fetching ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : children.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <Baby size={30} className="text-violet-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Aucun enfant ajouté</p>
              <p className="mt-1 text-sm text-gray-400 max-w-xs mx-auto">
                Ajoutez vos enfants pour gérer leurs cours et suivre leur progression
              </p>
            </div>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={14} className="mr-1 inline" /> Ajouter mon premier enfant
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child, idx) => {
              const color = CHILD_COLORS[idx % CHILD_COLORS.length];
              const age = getAge(child.date_of_birth);
              return (
                <div
                  key={child.id}
                  className={`rounded-2xl border ${color.border} bg-white shadow-sm overflow-hidden`}
                >
                  {/* Card header */}
                  <div className={`${color.light} px-5 py-4`}>
                    <div className="flex items-center gap-4">
                      {child.avatar ? (
                        <img src={child.avatar} alt="" className="h-14 w-14 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${color.bg} text-white text-lg font-bold shadow-sm`}>
                          {initials(child)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900">
                          {child.first_name} {child.last_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {age && (
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color.light} ${color.text}`}>
                              <Baby size={10} /> {age}
                            </span>
                          )}
                          {child.level && (
                            <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-gray-700">
                              <GraduationCap size={10} /> {child.level.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(child)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-gray-500 hover:bg-white hover:text-gray-800 transition-colors shadow-sm"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer ${child.first_name} ?`)) handleDelete(child.id);
                          }}
                          disabled={deletingId === child.id}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      {child.school ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <School size={12} className="text-gray-400" />
                          <span>{child.school}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 italic">
                          <School size={12} /> École non renseignée
                        </div>
                      )}
                      {child.date_of_birth && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{new Date(child.date_of_birth).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/profile/children/${child.id}`}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border ${color.border} ${color.light} ${color.text} py-2 text-xs font-semibold transition-colors hover:opacity-80`}
                      >
                        <Users size={12} /> Voir le profil
                      </Link>
                      <Link
                        href={`/profile/children/${child.id}/agenda`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        <Calendar size={12} /> Agenda
                        <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add another button */}
            <button
              onClick={openAdd}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-5 text-sm font-semibold text-gray-400 transition-colors hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
            >
              <Plus size={16} /> Ajouter un autre enfant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
