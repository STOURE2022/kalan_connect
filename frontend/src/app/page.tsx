"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, BookOpen, ArrowRight, CheckCircle2,
  Star, GraduationCap, MessageCircle, CalendarDays,
  Shield, Users, Sparkles, ChevronRight,
  Calculator, Globe, Atom, Leaf, Monitor, Languages,
  TrendingUp, Award, Clock, Trophy, Flame, Target,
} from "lucide-react";
import { search as searchApi, teachers as teachersApi, sessions as sessionsApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import TeacherCard from "@/components/teachers/TeacherCard";
import type { Subject, TeacherListItem, GroupSession, PaginatedResponse } from "@/types";

const CITIES = ["Bamako", "Sikasso", "Ségou", "Mopti", "Kayes", "Gao"];

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  mathematiques: Calculator,
  francais: BookOpen,
  anglais: Globe,
  physique: Atom,
  svt: Leaf,
  chimie: Atom,
  informatique: Monitor,
  arabe: Languages,
};

const SUBJECT_STYLES: Record<string, { gradient: string; icon: string; label: string; count: string; shadow: string }> = {
  mathematiques: { gradient: "from-blue-500 to-indigo-600",    icon: "text-white", label: "text-white",         count: "text-blue-100",    shadow: "shadow-blue-500/30"    },
  francais:      { gradient: "from-primary-500 to-emerald-500",icon: "text-white", label: "text-white",         count: "text-emerald-100", shadow: "shadow-primary-500/30" },
  anglais:       { gradient: "from-purple-500 to-violet-600",  icon: "text-white", label: "text-white",         count: "text-purple-100",  shadow: "shadow-purple-500/30"  },
  physique:      { gradient: "from-orange-500 to-amber-500",   icon: "text-white", label: "text-white",         count: "text-orange-100",  shadow: "shadow-orange-500/30"  },
  svt:           { gradient: "from-emerald-500 to-teal-600",   icon: "text-white", label: "text-white",         count: "text-emerald-100", shadow: "shadow-emerald-500/30" },
  chimie:        { gradient: "from-pink-500 to-rose-600",      icon: "text-white", label: "text-white",         count: "text-pink-100",    shadow: "shadow-pink-500/30"    },
  informatique:  { gradient: "from-indigo-500 to-purple-600",  icon: "text-white", label: "text-white",         count: "text-indigo-100",  shadow: "shadow-indigo-500/30"  },
  arabe:         { gradient: "from-amber-500 to-orange-500",   icon: "text-white", label: "text-white",         count: "text-amber-100",   shadow: "shadow-amber-500/30"   },
};

function getSubjectStyle(slug: string) {
  return SUBJECT_STYLES[slug] ?? { gradient: "from-gray-500 to-gray-600", icon: "text-white", label: "text-white", count: "text-gray-200", shadow: "shadow-gray-500/20" };
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Bamako");
  const [popularSubjects, setPopularSubjects] = useState<(Subject & { teacher_count: number })[]>([]);
  const [featuredTeachers, setFeaturedTeachers] = useState<TeacherListItem[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<{
    subjects: Subject[];
    teachers: TeacherListItem[];
  } | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<GroupSession[]>([]);

  useEffect(() => {
    searchApi.popular(city).then(setPopularSubjects).catch(() => {});
    teachersApi.search({ city, page: 1 })
      .then((res: PaginatedResponse<TeacherListItem>) => setFeaturedTeachers((res.results ?? []).slice(0, 3)))
      .catch(() => {});
  }, [city]);

  useEffect(() => {
    sessionsApi.list({ status: "open" })
      .then((res: PaginatedResponse<GroupSession>) => setUpcomingSessions((res.results ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) { setAutocompleteResults(null); return; }
    const t = setTimeout(() => {
      teachersApi.autocomplete(query).then(setAutocompleteResults).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 left-1/4 h-64 w-64 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="absolute right-1/3 top-1/2 h-48 w-48 rounded-full bg-primary-300/15 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-14 md:pb-28 md:pt-20">
          {/* Badge */}
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles size={13} className="text-accent-300" />
            <span className="text-xs font-semibold text-white">Bamako · Sikasso · Ségou · Mopti</span>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-3xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
              Trouvez le meilleur professeur{" "}
              <span className="relative inline-block">
                <span className="relative z-10">pour tous les âges</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-accent-400/40" />
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-primary-100 md:text-lg">
              Des professeurs vérifiés. Cours à domicile, en ligne ou chez l&apos;élève.
            </p>
          </div>

          {/* Trust badges */}
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Shield,    label: "Profils vérifiés"      },
              { icon: Star,      label: "Note moyenne 4.8/5"     },
              { icon: Clock,     label: "Réponse en moins de 2h" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                <Icon size={13} className="text-accent-300" /> {label}
              </div>
            ))}
          </div>

          {/* Search box */}
          <form onSubmit={handleSearch} className="relative mx-auto mt-8 max-w-2xl">
            <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
              {/* Query */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Maths, Français, Physique..."
                  className="w-full rounded-xl bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              {/* City */}
              <div className="relative flex-shrink-0">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-gray-50 py-3.5 pl-9 pr-8 text-sm text-gray-700 focus:outline-none sm:w-36"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Submit */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-colors hover:bg-primary-600"
              >
                <Search size={16} />
                <span>Rechercher</span>
              </button>
            </div>

            {/* Autocomplete */}
            {autocompleteResults && (autocompleteResults.subjects.length > 0 || autocompleteResults.teachers.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                {autocompleteResults.subjects.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Matières</p>
                    {autocompleteResults.subjects.map((s) => (
                      <button key={s.id} type="button"
                        onClick={() => { router.push(`/search?subject=${s.slug}&city=${city}`); setAutocompleteResults(null); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <BookOpen size={14} className="text-primary-500" /> {s.name}
                      </button>
                    ))}
                  </div>
                )}
                {autocompleteResults.teachers.length > 0 && (
                  <div className="border-t border-gray-50 p-2">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Professeurs</p>
                    {autocompleteResults.teachers.map((t) => (
                      <button key={t.id} type="button"
                        onClick={() => { router.push(`/teachers/${t.id}`); setAutocompleteResults(null); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-primary-50"
                      >
                        <GraduationCap size={14} className="text-primary-500" />
                        {t.user.first_name} {t.user.last_name}
                        <span className="ml-auto text-xs text-gray-400">{t.subjects[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 divide-x divide-gray-100 md:grid-cols-4">
            {[
              { value: "500+",    label: "Professeurs",        color: "text-primary-600"  },
              { value: "20+",     label: "Matières",           color: "text-blue-600"     },
              { value: "4.8/5",   label: "Note moyenne",       color: "text-amber-500"    },
              { value: "48h",     label: "Délai de vérif.",    color: "text-purple-600"   },
            ].map(({ value, label, color }) => (
              <div key={label} className="flex flex-col items-center py-6 text-center">
                <span className={`text-2xl font-black md:text-3xl ${color}`}>{value}</span>
                <span className="mt-0.5 text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR SUBJECTS ──────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Matières 📝</p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">Les plus demandées à {city}</h2>
            </div>
            <Link href="/search" className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
              Tout voir <ChevronRight size={15} />
            </Link>
          </div>

          {popularSubjects.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {popularSubjects.slice(0, 8).map((subject) => {
                const Icon  = SUBJECT_ICONS[subject.slug] ?? BookOpen;
                const style = getSubjectStyle(subject.slug);
                return (
                  <button
                    key={subject.id}
                    onClick={() => router.push(`/search?subject=${subject.slug}&city=${city}`)}
                    className={`group relative overflow-hidden flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${style.gradient} p-5 text-center shadow-md ${style.shadow} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
                  >
                    {/* Cercle déco */}
                    <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-3 -left-3 h-12 w-12 rounded-full bg-white/10" />

                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Icon size={22} className={style.icon} />
                    </div>
                    <div className="relative">
                      <p className={`text-sm font-bold ${style.label}`}>{subject.name}</p>
                      <p className={`mt-0.5 text-xs ${style.count}`}>
                        {subject.teacher_count} prof{subject.teacher_count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED TEACHERS ─────────────────────────────────────────────── */}
      {featuredTeachers.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Professeurs 👨‍💼</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">Disponibles à {city} 📍</h2>
              </div>
              <Link href={`/search?city=${city}`} className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
                Tous les profs <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTeachers.map((t) => <TeacherCard key={t.id} teacher={t} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── ÉVÉNEMENTS À VENIR ────────────────────────────────────────────── */}
      {upcomingSessions.length > 0 && (
        <section className="py-14 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">En ce moment</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Cours collectifs disponibles 👥</h2>
                <p className="mt-1 text-sm text-gray-500">Rejoignez un groupe, payez moins, apprenez ensemble 📚🚀</p>
              </div>
              <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                Tous les événements <ChevronRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/events/${s.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  {/* Top accent */}
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />

                  <div className="flex flex-col gap-3 p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 leading-tight line-clamp-1">{s.title}</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">{s.subject?.name}</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.spots_left === 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                        {s.spots_left === 0 ? "Complet" : `${s.spots_left} place${s.spots_left > 1 ? "s" : ""}`}
                      </span>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={s.teacher?.photo ?? null}
                        firstName={s.teacher?.first_name ?? "P"}
                        lastName={s.teacher?.last_name ?? ""}
                        size="xs"
                      />
                      <span className="text-xs text-gray-500">{s.teacher?.first_name} {s.teacher?.last_name}</span>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">{s.participants_count}/{s.max_participants} inscrits</span>
                        <span className={`text-[10px] font-bold ${s.spots_left === 0 ? "text-red-500" : s.participants_count / s.max_participants >= 0.7 ? "text-amber-600" : "text-emerald-600"}`}>
                          {s.spots_left === 0 ? "Complet" : `${s.spots_left} libre${s.spots_left > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${s.spots_left === 0 ? "bg-red-500" : s.participants_count / s.max_participants >= 0.7 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, (s.participants_count / s.max_participants) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-base font-black text-emerald-600">
                        {s.price_per_student === 0 ? "Gratuit" : `${s.price_per_student.toLocaleString("fr-FR")} FCFA`}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-emerald-600">
                        Rejoindre <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONCOURS BANNER ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-yellow-300/20 blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <div className="mb-3 flex items-center justify-center gap-2 md:justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Flame size={16} className="text-yellow-200" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Offre spéciale 2026 🎉🎉🎉</span>
              </div>
              <h2 className="text-2xl font-black text-white md:text-3xl">
                Tu prépares un concours ?
              </h2>
              <p className="mt-2 text-sm text-orange-100 max-w-md">
                Accès à des profs spécialisés BAC, BEPC, ENI, Fonction publique et plus — pendant 3 mois pour seulement 3 500 FCFA.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {[Trophy, Target, Clock].map((Icon, i) => {
                  const labels = ["Profs spécialistes", "Prépa ciblée", "Soir & week-end"];
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                      <Icon size={13} className="text-yellow-200" /> {labels[i]}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm px-6 py-4 text-center">
                <p className="text-3xl font-black text-white">3 500 <span className="text-lg font-medium text-orange-200">FCFA</span></p>
                <p className="text-sm font-semibold text-orange-100">3 mois d&apos;accès complet</p>
                <p className="text-xs text-orange-200 mt-0.5">= 1 167 FCFA/mois</p>
              </div>
              <Link
                href="/concours"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-orange-600 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] w-full"
              >
                <Trophy size={15} /> Voir l&apos;offre concours <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Simple & rapide</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Comment ça marche</h2>
          </div>

          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop only) */}
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent lg:block" />

            {[
              { icon: Search,       num: "01", title: "Recherchez",  desc: "Filtrez par matière, niveau et quartier",              color: "bg-primary-500" },
              { icon: MessageCircle,num: "02", title: "Contactez",   desc: "Échangez directement via la messagerie intégrée",       color: "bg-blue-500"    },
              { icon: CalendarDays, num: "03", title: "Réservez",    desc: "Choisissez un créneau et confirmez le cours",           color: "bg-accent-500"  },
              { icon: TrendingUp,   num: "04", title: "Progressez",  desc: "Suivez les progrès de votre enfant semaine après semaine", color: "bg-purple-500" },
            ].map(({ icon: Icon, num, title, desc, color }) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl ${color} shadow-lg`}>
                  <Icon size={28} className="text-white" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-[10px] font-black text-white">
                    {num}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Tarifs</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Un abonnement simple et transparent</h2>
            <p className="mt-2 text-sm text-gray-500">Accédez à tous les professeurs, sans frais cachés</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Concours */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50 p-8 shadow-sm">
              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">
                <Trophy size={11} /> Concours
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Prépa Concours</h3>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-black text-gray-900">3 500</span>
                <span className="text-base font-medium text-gray-400"> FCFA</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-amber-600">3 mois d&apos;accès complet</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Profs spécialistes concours",
                  "BAC, BEPC, ENI, Fonction publique...",
                  "Messagerie illimitée",
                  "Réservation de cours",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-amber-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/concours")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:scale-[1.02]"
              >
                Voir l&apos;offre <ArrowRight size={15} />
              </button>
            </div>

            {/* Monthly */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Mensuel</h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Sans engagement</span>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-black text-gray-900">1 500</span>
                <span className="text-base font-medium text-gray-400"> FCFA/mois</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "Accès à tous les profils",
                  "Messagerie illimitée",
                  "Réservation de cours",
                  "Support client",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-primary-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/payment?plan=monthly")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-500 py-3 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50"
              >
                Commencer <ArrowRight size={15} />
              </button>
            </div>

            {/* Annual */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-600 p-8 shadow-xl shadow-primary-500/25">
              {/* Decoration */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute right-4 top-4 rounded-full bg-accent-400 px-3 py-1 text-xs font-black text-white">
                -17% 🎉
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Annuel</h3>
                <Award size={20} className="text-accent-300" />
              </div>
              <div className="mt-6">
                <span className="text-4xl font-black text-white">15 000</span>
                <span className="text-base font-medium text-primary-200"> FCFA/an</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-primary-200">= 1 250 FCFA/mois · 2 mois offerts</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Accès à tous les profils",
                  "Messagerie illimitée",
                  "Réservation de cours",
                  "2 mois gratuits",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-primary-100">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-accent-300" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/payment?plan=annual")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-black text-primary-700 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                Meilleure offre <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/20">
            <GraduationCap size={28} className="text-primary-400" />
          </div>
          <h2 className="text-2xl font-black text-white md:text-3xl">
            Prêt à trouver le professeur idéal 🤓?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
            Rejoignez des centaines de familles qui font confiance à KalanConnect pour l&apos;éducation de leurs enfants.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-400 hover:scale-[1.02] sm:w-auto"
            >
              <Users size={16} /> Créer un compte gratuit
            </Link>
            <Link
              href="/search"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 sm:w-auto"
            >
              <Search size={16} /> Parcourir les professeurs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
