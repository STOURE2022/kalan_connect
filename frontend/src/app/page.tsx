"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Star,
  Users,
  GraduationCap,
  MessageCircle,
  CalendarDays,
  Shield,
} from "lucide-react";
import { search as searchApi, teachers as teachersApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Subject, TeacherListItem } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Bamako");
  const [popularSubjects, setPopularSubjects] = useState<
    (Subject & { teacher_count: number })[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<{
    subjects: Subject[];
    teachers: TeacherListItem[];
  } | null>(null);

  useEffect(() => {
    searchApi.popular(city).then(setPopularSubjects).catch(() => {});
  }, [city]);

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setAutocompleteResults(null);
      return;
    }
    const timer = setTimeout(() => {
      teachersApi.autocomplete(query).then(setAutocompleteResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    router.push(`/search?${params.toString()}`);
  };

  const subjectIcons: Record<string, string> = {
    mathematiques: "calculator",
    francais: "book-open",
    physique: "atom",
    anglais: "globe",
    svt: "leaf",
    chimie: "flask",
    informatique: "monitor",
    "histoire-geo": "globe",
  };

  return (
    <div>
      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700">
        {/* Decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent-400" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
              Trouvez le meilleur professeur pour votre enfant
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              +500 professeurs qualifies a Bamako. Cours a domicile ou en
              ligne.
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="relative mx-auto mt-8 max-w-xl"
            >
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-primary-900/20 sm:flex-row">
                {/* Query */}
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Maths, Francais, Physique..."
                    className="w-full rounded-xl bg-gray-50 py-3 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                {/* City */}
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 py-3 pl-9 pr-8 text-sm focus:outline-none sm:w-36"
                  >
                    <option value="Bamako">Bamako</option>
                    <option value="Sikasso">Sikasso</option>
                    <option value="Segou">Segou</option>
                    <option value="Mopti">Mopti</option>
                  </select>
                </div>

                {/* Button */}
                <button type="submit" className="btn-primary gap-2 !rounded-xl">
                  <Search size={18} />
                  <span className="sm:hidden">Rechercher</span>
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {autocompleteResults &&
                (autocompleteResults.subjects.length > 0 ||
                  autocompleteResults.teachers.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                    {autocompleteResults.subjects.length > 0 && (
                      <div className="mb-2">
                        <p className="px-3 py-1 text-xs font-semibold text-gray-400">
                          Matieres
                        </p>
                        {autocompleteResults.subjects.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              router.push(`/search?subject=${s.slug}&city=${city}`);
                              setAutocompleteResults(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            <BookOpen size={14} className="text-primary-500" />
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {autocompleteResults.teachers.length > 0 && (
                      <div>
                        <p className="px-3 py-1 text-xs font-semibold text-gray-400">
                          Professeurs
                        </p>
                        {autocompleteResults.teachers.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              router.push(`/teachers/${t.id}`);
                              setAutocompleteResults(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            <GraduationCap size={14} className="text-accent-500" />
                            {t.user.first_name} {t.user.last_name}
                            <span className="ml-auto text-xs text-gray-400">
                              {t.subjects[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </form>
          </div>
        </div>
      </section>

      {/* ───── POPULAR SUBJECTS ───── */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-bold text-gray-900">Matieres populaires</h2>
        <p className="mt-1 text-sm text-gray-500">
          Les plus demandees a {city}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {popularSubjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() =>
                router.push(`/search?subject=${subject.slug}&city=${city}`)
              }
              className="card group flex flex-col items-center gap-2 py-6 text-center transition-all hover:border-primary-200 hover:bg-primary-50/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-200">
                <BookOpen size={24} />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {subject.name}
              </span>
              <span className="text-xs text-gray-400">
                {subject.teacher_count} professeurs
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Comment ca marche
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: "Recherchez",
                desc: "Trouvez un professeur par matiere, niveau et quartier",
                color: "bg-primary-100 text-primary-600",
              },
              {
                icon: MessageCircle,
                title: "Contactez",
                desc: "Echangez avec le professeur via la messagerie",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: CalendarDays,
                title: "Reservez",
                desc: "Choisissez un creneau et reservez le cours",
                color: "bg-accent-100 text-accent-600",
              },
              {
                icon: Star,
                title: "Progressez",
                desc: "Votre enfant progresse avec un suivi personnalise",
                color: "bg-purple-100 text-purple-600",
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${color}`}
                >
                  <Icon size={28} />
                </div>
                <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-3 text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PRICING ───── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Un abonnement simple
          </h2>
          <p className="mt-2 text-gray-500">
            Accedez a tous les professeurs pour un prix unique
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Monthly */}
          <div className="card flex flex-col items-center p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Mensuel</h3>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">
                1 500
              </span>
              <span className="text-lg text-gray-500"> FCFA/mois</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">Sans engagement</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
              {[
                "Acces a tous les profils",
                "Messagerie illimitee",
                "Reservation de cours",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/payment?plan=monthly")}
              className="btn-secondary mt-6 w-full"
            >
              S&apos;abonner
            </button>
          </div>

          {/* Annual */}
          <div className="card relative flex flex-col items-center border-2 border-primary-500 p-8 text-center">
            <div className="absolute -top-3 right-4 rounded-full bg-accent-500 px-3 py-0.5 text-xs font-bold text-white">
              -17%
            </div>
            <h3 className="text-lg font-semibold text-primary-600">Annuel</h3>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">
                15 000
              </span>
              <span className="text-lg text-gray-500"> FCFA/an</span>
            </div>
            <p className="mt-2 text-sm text-primary-500">
              = 1 250 FCFA/mois (2 mois offerts)
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
              {[
                "Acces a tous les profils",
                "Messagerie illimitee",
                "Reservation de cours",
                "2 mois gratuits",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/payment?plan=annual")}
              className="btn-primary mt-6 w-full"
            >
              S&apos;abonner
            </button>
          </div>
        </div>
      </section>

      {/* ───── TRUST ───── */}
      <section className="bg-gray-900 py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-center text-white sm:gap-16">
          <div>
            <div className="text-3xl font-extrabold text-primary-400">500+</div>
            <div className="mt-1 text-sm text-gray-400">Professeurs</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-primary-400">20+</div>
            <div className="mt-1 text-sm text-gray-400">Matieres</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-primary-400">
              Bamako
            </div>
            <div className="mt-1 text-sm text-gray-400">& bientot tout le Mali</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-accent-400">
              4.8/5
            </div>
            <div className="mt-1 text-sm text-gray-400">Note moyenne</div>
          </div>
        </div>
      </section>
    </div>
  );
}
