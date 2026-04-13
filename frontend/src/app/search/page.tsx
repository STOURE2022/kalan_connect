"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, SlidersHorizontal } from "lucide-react";
import { teachers as teachersApi } from "@/lib/api";
import TeacherCard from "@/components/teachers/TeacherCard";
import SearchFilters from "@/components/teachers/SearchFilters";
import { TeacherCardSkeleton } from "@/components/ui/LoadingSpinner";
import type { SearchFilters as FiltersType, TeacherListItem } from "@/types";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="skeleton h-11 rounded-xl" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeacherCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FiltersType>({
    subject:  searchParams.get("subject") || undefined,
    level:    searchParams.get("level")   || undefined,
    city:     searchParams.get("city")    || "Bamako",
    q:        searchParams.get("q")       || undefined,
    ordering: "-avg_rating",
    page: 1,
  });

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [results, setResults]         = useState<TeacherListItem[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [hasMore, setHasMore]         = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useCallback(async (f: FiltersType, append = false) => {
    setLoading(true);
    try {
      const data = await teachersApi.search(f);
      setResults(append ? (prev) => [...prev, ...data.results] : data.results);
      setTotalCount(data.count);
      setHasMore(!!data.next);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(filters);
  }, [filters, fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, q: searchInput || undefined, page: 1 }));
  };

  const clearSearch = () => {
    setSearchInput("");
    setFilters((f) => ({ ...f, q: undefined, page: 1 }));
    inputRef.current?.focus();
  };

  const loadMore = () => {
    const next = { ...filters, page: (filters.page || 1) + 1 };
    setFilters(next);
    fetchResults(next, true);
  };

  const geoActive = !!(filters.lat && filters.lng);
  const locationLabel = geoActive
    ? `Près de moi · ${filters.radius ?? 10} km`
    : filters.city || "Bamako";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Barre de recherche sticky ── */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-3 py-3 sm:px-4 sm:py-4">

          {/* Ligne recherche */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            {/* Input */}
            <div className="relative min-w-0 flex-1">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Professeur, matière..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:py-3 sm:pl-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Bouton chercher */}
            <button
              type="submit"
              className="flex-shrink-0 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors sm:px-5 sm:py-3"
            >
              <span className="hidden sm:inline">Chercher</span>
              <SearchIcon size={16} className="sm:hidden" />
            </button>

            {/* Bouton filtres */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors sm:py-3 ${
                showFilters
                  ? "border-primary-300 bg-primary-50 text-primary-600"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal size={15} />
            </button>
          </form>

          {/* Panneau filtres */}
          {showFilters && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
              <SearchFilters filters={filters} onChange={(f) => setFilters(f)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Résultats ── */}
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6">

        {/* Compteur */}
        {!loading && results.length > 0 && (
          <p className="mb-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{totalCount}</span>{" "}
            professeur{totalCount > 1 ? "s" : ""} trouvé{totalCount > 1 ? "s" : ""}
            {" · "}
            <span>{locationLabel}</span>
          </p>
        )}

        {/* États */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TeacherCardSkeleton key={i} />
            ))}
          </div>

        ) : results.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <SearchIcon size={24} className="text-gray-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-700">
              Aucun professeur trouvé
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Essayez de modifier vos filtres
            </p>
            <button
              onClick={() =>
                setFilters({ city: "Bamako", ordering: "-avg_rating", page: 1 })
              }
              className="mt-5 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>

        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>

            {/* Charger plus */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 shadow-sm hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 transition-colors sm:w-auto sm:px-10"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                      Chargement...
                    </span>
                  ) : (
                    "Voir plus de professeurs"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
