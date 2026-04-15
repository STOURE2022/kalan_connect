"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Award, GraduationCap,
  Building2, Calendar, FileText, ExternalLink, X, Check,
  Upload, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Diploma } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const CURRENT_YEAR = new Date().getFullYear();

// ── Carte diplôme ─────────────────────────────────────────────────────────────
function DiplomaCard({
  diploma,
  onDelete,
}: {
  diploma: Diploma;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#13151f] p-5 transition-all duration-200 hover:border-white/15 hover:shadow-lg hover:shadow-black/30">
      {/* Accent gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
          <Award size={20} className="text-indigo-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white leading-snug">{diploma.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Building2 size={11} /> {diploma.institution}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Calendar size={11} /> {diploma.year}
            </span>
          </div>

          {/* Document */}
          {diploma.document ? (
            <a
              href={diploma.document}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              <FileText size={11} /> Voir le document <ExternalLink size={9} />
            </a>
          ) : (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/20 italic">
              <FileText size={10} /> Pas de document joint
            </span>
          )}
        </div>

        {/* Delete */}
        <div className="flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onDelete(diploma.id)}
                className="flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <Check size={11} /> Supprimer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Formulaire d'ajout ────────────────────────────────────────────────────────
function AddForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (diploma: Diploma) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", institution: "", year: CURRENT_YEAR });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAccessToken();
    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("institution", form.institution);
      body.append("year", String(form.year));
      if (file) body.append("document", file);

      const res = await fetch(`${API}/teachers/diplomas/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Diploma = await res.json();
      toast.success("Diplôme ajouté !");
      onSuccess(data);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-indigo-500/20 bg-[#13151f] overflow-hidden mb-4"
    >
      {/* Form header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15">
            <Plus size={14} className="text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-white">Nouveau diplôme</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Titre */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/40 uppercase tracking-wider">
            Intitulé du diplôme <span className="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Master en Mathématiques Appliquées"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors"
            required
          />
        </div>

        {/* Établissement + Année */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/40 uppercase tracking-wider">
              Établissement <span className="text-red-400">*</span>
            </label>
            <input
              value={form.institution}
              onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}
              placeholder="Université de Bamako"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/40 uppercase tracking-wider">
              Année <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1950}
              max={CURRENT_YEAR}
              value={form.year}
              onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              required
            />
          </div>
        </div>

        {/* Upload document */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/40 uppercase tracking-wider">
            Document <span className="text-red-400">*</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
              <FileText size={16} className="text-indigo-400 flex-shrink-0" />
              <span className="flex-1 truncate text-sm text-white/70">{file.name}</span>
              <button
                type="button"
                onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/30 hover:border-indigo-500/30 hover:text-indigo-400 transition-colors"
            >
              <Upload size={15} />
              Joindre un fichier PDF ou image
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 border-t border-white/5 px-5 py-4">
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <Check size={15} />
          )}
          {saving ? "Ajout en cours..." : "Ajouter le diplôme"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/50 hover:border-white/20 hover:text-white/70 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function DiplomesPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    fetch(`${API}/teachers/diplomas/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setDiplomas(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const handleDelete = async (id: number) => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${API}/teachers/diplomas/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Diplôme supprimé");
      setDiplomas((p) => p.filter((d) => d.id !== id));
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f17]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0d0f17]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-base font-black text-white leading-none">Mes diplômes</h1>
              {!fetching && (
                <p className="text-xs text-white/30 mt-0.5">
                  {diplomas.length === 0
                    ? "Aucun diplôme ajouté"
                    : `${diplomas.length} diplôme${diplomas.length > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              showForm
                ? "bg-white/10 text-white/60 hover:bg-white/15"
                : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25"
            }`}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Annuler" : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">

        {/* Info banner */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 px-4 py-3.5">
          <Sparkles size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 leading-relaxed">
            Les diplômes renforcent votre crédibilité et augmentent vos chances d&apos;être sélectionné par les parents. Joignez les documents pour une vérification plus rapide.
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <AddForm
            onSuccess={(d) => {
              setDiplomas((p) => [d, ...p]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : diplomas.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/5 bg-[#13151f] py-20 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
                <GraduationCap size={34} className="text-indigo-400" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
                <Plus size={12} className="text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Aucun diplôme ajouté</p>
              <p className="mt-1 text-sm text-white/30 max-w-xs mx-auto">
                Ajoutez vos diplômes et certifications pour inspirer confiance aux parents
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 transition-colors"
            >
              <Plus size={14} /> Ajouter mon premier diplôme
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {diplomas.map((diploma) => (
              <DiplomaCard key={diploma.id} diploma={diploma} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
