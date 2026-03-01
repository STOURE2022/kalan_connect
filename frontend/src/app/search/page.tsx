"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { teachers as teachersApi } from "@/lib/api";
import TeacherCard from "@/components/teachers/TeacherCard";
import SearchFilters from "@/components/teachers/SearchFilters";
import { TeacherCardSkeleton } from "@/components/ui/LoadingSpinner";
import type { SearchFilters as FiltersType, TeacherListItem } from "@/types";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trouver un professeur</h1>
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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

  const [filters, setFilters] = useState<FiltersType>({
    subject: searchParams.get("subject") || undefined,
    level: searchParams.get("level") || undefined,
    city: searchParams.get("city") || "Bamako",
    q: searchParams.get("q") || undefined,
    ordering: "-avg_rating",
    page: 1,
  });

  const [results, setResults] = useState<TeacherListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchResults = useCallback(async (f: FiltersType, append = false) => {
    setLoading(true);
    try {
      const data = await teachersApi.search(f);
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
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

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  const loadMore = () => {
    const nextPage = (filters.page || 1) + 1;
    const newFilters = { ...filters, page: nextPage };
    setFilters(newFilters);
    fetchResults(newFilters, true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {filters.q ? (
            <>
              Resultats pour &laquo;{filters.q}&raquo;
            </>
          ) : filters.subject ? (
            <>Professeurs de {filters.subject}</>
          ) : (
            "Trouver un professeur"
          )}
        </h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} professeur{totalCount > 1 ? "s" : ""} trouve
            {totalCount > 1 ? "s" : ""}
            {filters.city && ` a ${filters.city}`}
          </p>
        )}
      </div>

      {/* Filters */}
      <SearchFilters filters={filters} onChange={handleFiltersChange} />

      {/* Results */}
      <div className="mt-6 space-y-3">
        {loading && results.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TeacherCardSkeleton key={i} />
          ))
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchIcon size={48} className="text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-600">
              Aucun professeur trouve
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        ) : (
          <>
            {results.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {loading ? "Chargement..." : "Charger plus"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
