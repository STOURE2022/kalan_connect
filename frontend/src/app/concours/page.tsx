"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy, BookOpen, Clock, Star, Shield, CheckCircle2,
  ArrowRight, GraduationCap, Target, Flame, Users,
  Calculator, Globe, Atom, Monitor, Leaf, Languages, ChevronRight,
} from "lucide-react";
import { teachers as teachersApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import type { TeacherListItem } from "@/types";

// ── Données statiques ──────────────────────────────────────────────────────────

const CONCOURS_LIST = [
  { emoji: "🏫", name: "BAC (Baccalauréat)", desc: "Toutes séries — Terminale" },
  { emoji: "📚", name: "BEPC", desc: "Brevet de fin de 3e" },
  { emoji: "🏛️", name: "ENI / ENSUP", desc: "Grandes écoles d'ingénieurs" },
  { emoji: "⚖️", name: "Fonction publique", desc: "Concours administratifs" },
  { emoji: "🏥", name: "Médecine / Pharmacie", desc: "Concours d'entrée santé" },
  { emoji: "🎓", name: "Écoles normales", desc: "Formation des maîtres (IFM)" },
  { emoji: "🛡️", name: "Armée / Gendarmerie", desc: "Concours militaires et police" },
  { emoji: "✈️", name: "Bourses & Ambassades", desc: "Sélection pour bourses d'études" },
];

const SUBJECTS_CONCOURS = [
  { icon: Calculator, name: "Mathématiques", slug: "mathematiques", color: "bg-blue-50 text-blue-600" },
  { icon: Atom,       name: "Physique-Chimie", slug: "physique",   color: "bg-orange-50 text-orange-600" },
  { icon: BookOpen,   name: "Français",       slug: "francais",    color: "bg-primary-50 text-primary-600" },
  { icon: Globe,      name: "Anglais",        slug: "anglais",     color: "bg-purple-50 text-purple-600" },
  { icon: Leaf,       name: "SVT",            slug: "svt",         color: "bg-emerald-50 text-emerald-600" },
  { icon: Monitor,    name: "Informatique",   slug: "informatique",color: "bg-indigo-50 text-indigo-600" },
  { icon: Languages,  name: "Arabe",          slug: "arabe",       color: "bg-amber-50 text-amber-600" },
];

const TESTIMONIALS = [
  { name: "Aminata K.", city: "Bamako", text: "Grâce à KalanConnect, j'ai trouvé un prof de maths spécialisé BAC. J'ai eu 16/20 à l'épreuve.", rating: 5 },
  { name: "Ibrahima D.", city: "Sikasso", text: "Le prof de physique m'a aidé à combler mes lacunes en 2 mois. Admis à l'ENI !", rating: 5 },
  { name: "Fatoumata S.", city: "Ségou", text: "Cours intensifs de français pendant 3 mois. Le suivi était parfait. Réussi mon BEPC.", rating: 5 },
];

// ── Teacher card ───────────────────────────────────────────────────────────────
function ConcoursTeacherCard({ teacher }: { teacher: TeacherListItem }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/teachers/${teacher.id}`)}
      className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left transition-all hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Avatar
              src={teacher.user.avatar}
              firstName={teacher.user.first_name}
              lastName={teacher.user.last_name}
              size="md"
            />
            {teacher.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary-500">
                <Shield size={9} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {teacher.user.first_name} {teacher.user.last_name}
            </p>
            <p className="text-xs text-gray-400">{teacher.city}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-extrabold text-primary-600 leading-none">
            {(teacher.hourly_rate / 1000).toFixed(0)}K
          </p>
          <p className="text-[10px] text-gray-400">FCFA/h</p>
        </div>
      </div>

      {/* Badge concours */}
      <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 w-fit">
        <Trophy size={12} className="text-amber-500" />
        <span className="text-xs font-bold text-amber-700">Spécialiste Concours</span>
      </div>

      {teacher.avg_rating > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={11} className={s <= Math.round(teacher.avg_rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">{teacher.avg_rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({teacher.total_reviews} avis)</span>
        </div>
      )}

      {teacher.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {teacher.subjects.slice(0, 3).map((s) => (
            <span key={s} className="rounded-lg bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-100">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-[11px] text-gray-400">{teacher.experience_years} ans d&apos;expérience</span>
        <span className="text-[11px] font-semibold text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
          Voir le profil →
        </span>
      </div>
    </button>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function ConcoursPage() {
  const router = useRouter();
  const [concoursTeachers, setConcoursTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teachersApi
      .search({ concours: true, city: "Bamako" } as never)
      .then((res) => setConcoursTeachers((res.results ?? []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-primary-600">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 h-56 w-56 rounded-full bg-yellow-300/20 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-14 text-center">
          {/* Badge */}
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <Flame size={13} className="text-yellow-200" />
            <span className="text-xs font-bold text-white">Offre spéciale Concours 2026</span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-white md:text-5xl">
            Prépare ton concours avec{" "}
            <span className="relative inline-block">
              <span className="relative z-10">les meilleurs profs</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-yellow-400/40" />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-orange-100 md:text-lg">
            Des professeurs spécialisés en préparation intensive aux concours maliens et internationaux.
            Cours particuliers à domicile, en ligne ou chez toi.
          </p>

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Trophy, label: "Profs spécialistes concours" },
              { icon: Target, label: "Méthode intensive & ciblée" },
              { icon: Clock,  label: "Disponibles week-end & soir" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                <Icon size={13} className="text-yellow-200" /> {label}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/payment?plan=concours")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-orange-600 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] sm:w-auto"
            >
              <Trophy size={16} /> S&apos;abonner — 3 500 FCFA / 3 mois
            </button>
            <button
              onClick={() => router.push("/search?concours=true")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
            >
              <GraduationCap size={16} /> Voir les profs concours
            </button>
          </div>
        </div>
      </section>

      {/* ── PRIX ── */}
      <section className="bg-amber-50 border-b border-amber-100 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
            <div className="flex items-center gap-4 rounded-2xl bg-white border border-amber-200 shadow-sm px-6 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30">
                <Trophy size={26} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Offre Concours</p>
                <p className="text-3xl font-black text-gray-900">3 500 <span className="text-base font-medium text-gray-400">FCFA</span></p>
                <p className="text-sm font-semibold text-amber-700">3 mois d&apos;accès complet</p>
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="text-sm font-bold text-gray-700 mb-3">Ce qui est inclus :</p>
              <ul className="space-y-2">
                {[
                  "Accès aux profils de tous les profs spécialistes",
                  "Messagerie illimitée pour poser tes questions",
                  "Réservation de cours particuliers",
                  "Suivi personnalisé de ta progression",
                  "Support client prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="flex-shrink-0 text-amber-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/payment?plan=concours")}
                className="mt-5 flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:scale-[1.02]"
              >
                Commencer maintenant <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONCOURS CIBLÉS ── */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Compétitions</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Les concours que nous préparons</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONCOURS_LIST.map((c) => (
              <div key={c.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATIÈRES ── */}
      <section className="bg-gray-50/60 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Matières</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Trouve ton prof selon la matière</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {SUBJECTS_CONCOURS.map(({ icon: Icon, name, slug, color }) => (
              <button
                key={slug}
                onClick={() => router.push(`/search?subject=${slug}&concours=true`)}
                className={`flex items-center gap-2 rounded-xl border border-transparent bg-white px-4 py-3 shadow-sm text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${color}`}
              >
                <Icon size={16} /> {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROFS SPÉCIALISTES ── */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Experts</p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">Profs spécialistes concours</h2>
            </div>
            <Link href="/search?concours=true" className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
              Tous les profs <ChevronRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : concoursTeachers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {concoursTeachers.map((t) => <ConcoursTeacherCard key={t.id} teacher={t} />)}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-12 text-center">
              <Trophy size={32} className="mx-auto text-amber-300" />
              <p className="mt-3 text-sm font-medium text-amber-700">Aucun spécialiste disponible pour le moment</p>
              <p className="mt-1 text-xs text-amber-500">Reviens bientôt ou recherche parmi tous nos profs</p>
              <button
                onClick={() => router.push("/search")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600"
              >
                Explorer les profs <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="bg-gray-50/60 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Témoignages</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Ils ont réussi leur concours</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col gap-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-gradient-to-br from-amber-500 to-orange-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Trophy size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white md:text-3xl">
            Ta réussite commence maintenant
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-orange-100">
            3 mois de préparation intensive avec les meilleurs spécialistes pour seulement 3 500 FCFA.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/payment?plan=concours")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-orange-600 shadow-xl transition-all hover:scale-[1.02] sm:w-auto"
            >
              <Trophy size={16} /> Je m&apos;abonne — 3 500 FCFA
            </button>
            <Link
              href="/auth/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white/20 sm:w-auto"
            >
              <Users size={16} /> Créer un compte gratuit
            </Link>
          </div>
          <p className="mt-4 text-xs text-orange-200">Sans engagement · Accès immédiat · Paiement via Orange Money</p>
        </div>
      </section>

    </div>
  );
}
