"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { teachers as teachersApi } from "@/lib/api";
import type { Subject, Level, SearchFilters as FiltersType } from "@/types";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
}

export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    teachersApi.getSubjects().then(setSubjects).catch(() => {});
    teachersApi.getLevels().then(setLevels).catch(() => {});
  }, []);

  const update = (key: keyof FiltersType, value: string | number | boolean | undefined) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v !== undefined && v !== "" && k !== "page" && k !== "ordering"
  ).length;

  return (
    <div className="space-y-3">
      {/* Quick filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Subject */}
        <select
          value={filters.subject || ""}
          onChange={(e) => update("subject", e.target.value || undefined)}
          className="input max-w-[160px] !py-2 text-sm"
        >
          <option value="">Toutes matieres</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Level */}
        <select
          value={filters.level || ""}
          onChange={(e) => update("level", e.target.value || undefined)}
          className="input max-w-[160px] !py-2 text-sm"
        >
          <option value="">Tous niveaux</option>
          {levels.map((l) => (
            <option key={l.id} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>

        {/* City */}
        <select
          value={filters.city || "Bamako"}
          onChange={(e) => update("city", e.target.value)}
          className="input max-w-[140px] !py-2 text-sm"
        >
          <option value="Bamako">Bamako</option>
          <option value="Sikasso">Sikasso</option>
          <option value="Segou">Segou</option>
          <option value="Mopti">Mopti</option>
          <option value="Koutiala">Koutiala</option>
          <option value="Kayes">Kayes</option>
        </select>

        {/* Ordering */}
        <select
          value={filters.ordering || "-avg_rating"}
          onChange={(e) => update("ordering", e.target.value)}
          className="input max-w-[150px] !py-2 text-sm"
        >
          <option value="-avg_rating">Meilleure note</option>
          <option value="hourly_rate">Prix croissant</option>
          <option value="-hourly_rate">Prix decroissant</option>
          <option value="-total_reviews">Plus d&apos;avis</option>
          <option value="-created_at">Plus recents</option>
        </select>

        {/* Toggle advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "input flex max-w-fit items-center gap-1.5 !py-2 text-sm",
            activeCount > 0 && "border-primary-500 text-primary-600"
          )}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Filtres avances</h4>
            <button
              onClick={() => setShowAdvanced(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Quartier */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Quartier
              </label>
              <input
                type="text"
                placeholder="Ex: Hamdallaye"
                value={filters.neighborhood || ""}
                onChange={(e) => update("neighborhood", e.target.value || undefined)}
                className="input !py-2 text-sm"
              />
            </div>

            {/* Prix min */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Prix min (FCFA)
              </label>
              <input
                type="number"
                placeholder="500"
                value={filters.min_rate || ""}
                onChange={(e) =>
                  update("min_rate", e.target.value ? Number(e.target.value) : undefined)
                }
                className="input !py-2 text-sm"
              />
            </div>

            {/* Prix max */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Prix max (FCFA)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={filters.max_rate || ""}
                onChange={(e) =>
                  update("max_rate", e.target.value ? Number(e.target.value) : undefined)
                }
                className="input !py-2 text-sm"
              />
            </div>

            {/* Note min */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Note minimale
              </label>
              <select
                value={filters.min_rating || ""}
                onChange={(e) =>
                  update("min_rating", e.target.value ? Number(e.target.value) : undefined)
                }
                className="input !py-2 text-sm"
              >
                <option value="">Tous</option>
                <option value="4">4+ etoiles</option>
                <option value="3">3+ etoiles</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.online || false}
                onChange={(e) => update("online", e.target.checked || undefined)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Cours en ligne
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verified || false}
                onChange={(e) => update("verified", e.target.checked || undefined)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Verifie uniquement
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
