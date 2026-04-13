"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Monitor, Users, User2,
  Loader2, Search, X, LocateFixed, SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { sessions as sessionsApi, teachers as teachersApi } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import type { GroupSession, Subject } from "@/types";

const STATUS_CONFIG = {
  open:      { label: "Ouvert",  bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  full:      { label: "Complet", bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500"     },
  cancelled: { label: "Annulé",  bg: "bg-gray-100",    text: "text-gray-500",    dot: "bg-gray-400"    },
  completed: { label: "Terminé", bg: "bg-gray-100",    text: "text-gray-500",    dot: "bg-gray-400"    },
};

const LOCATION_CFG: Record<string, { icon: React.ElementType; label: string }> = {
  online:     { icon: Monitor, label: "En ligne"           },
  at_teacher: { icon: User2,   label: "Chez le professeur" },
  other:      { icon: MapPin,  label: "Autre lieu"         },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

type Filters = {
  q: string; subject: string; status: string;
  location_type: string; price: string; date: string;
};
const EMPTY: Filters = { q: "", subject: "", status: "", location_type: "", price: "", date: "" };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-primary-500 text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600"
      }`}
    >
      {children}
    </button>
  );
}

// ── Card événement ───────────────────────────────────────────────────────────
function SessionCard({ s }: { s: GroupSession }) {
  const cfg     = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.open;
  const loc     = LOCATION_CFG[s.location_type] ?? LOCATION_CFG.online;
  const LocIcon = loc.icon;
  const pct     = s.max_participants > 0 ? s.participants_count / s.max_participants : 0;
  const isFull  = s.spots_left === 0;

  return (
    <Link href={`/events/${s.id}`} className="group block">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/8">

        {/* Bande couleur en haut */}
        <div className={`h-1 w-full ${isFull ? "bg-red-400" : pct >= 0.7 ? "bg-amber-400" : "bg-primary-400"}`} />

        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Header : avatar + titre + badge statut */}
          <div className="flex items-start gap-3">
            <Avatar
              src={s.teacher.photo}
              firstName={s.teacher.first_name}
              lastName={s.teacher.last_name}
              size="sm"
              className="mt-0.5 flex-shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-primary-600">
                {s.title}
              </h3>
              <p className="mt-0.5 truncate text-xs text-gray-400">
                {s.teacher.first_name} {s.teacher.last_name}
              </p>
            </div>
            <span className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Badges matière + lieu */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-lg bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              {s.subject.name}
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500">
              <LocIcon size={10} /> {loc.label}
            </span>
            {s.price_per_student === 0 && (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Gratuit</span>
            )}
          </div>

          {/* Date + horaire */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} className="text-gray-300" />
              <span className="capitalize font-medium">{fmtDate(s.date)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-gray-300" />
              {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
            </span>
          </div>

          {/* Barre de progression places */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Users size={10} /> {s.participants_count}/{s.max_participants}
              </span>
              <span className={`text-[11px] font-bold ${isFull ? "text-red-500" : pct >= 0.7 ? "text-amber-600" : "text-primary-600"}`}>
                {isFull ? "Complet" : `${s.spots_left} libre${s.spots_left > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? "bg-red-500" : pct >= 0.7 ? "bg-amber-400" : "bg-primary-500"
                }`}
                style={{ width: `${Math.min(100, pct * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer prix + CTA */}
        <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3">
          <span className="font-black text-gray-900">
            {s.price_per_student === 0 ? (
              <span className="text-emerald-600 text-sm">Gratuit</span>
            ) : (
              <>
                <span className="text-base">{s.price_per_student.toLocaleString("fr-FR")}</span>
                <span className="text-xs font-normal text-gray-400"> FCFA/élève</span>
              </>
            )}
          </span>
          <span className="flex items-center gap-1 rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-primary-600">
            Voir <ChevronRight size={12} />
          </span>
        </div>
      </article>
    </Link>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [items,    setItems]    = useState<GroupSession[]>([]);
  const [total,    setTotal]    = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [geoActive,   setGeoActive]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    teachersApi.getSubjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    sessionsApi.list({
      q:             filters.q             || undefined,
      subject:       filters.subject       || undefined,
      status:        filters.status        || undefined,
      location_type: filters.location_type || undefined,
      price:         (filters.price as "free" | "paid") || undefined,
      date:          (filters.date as "today" | "week" | "upcoming") || undefined,
    })
      .then((r) => { setItems(r.results ?? []); setTotal(r.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const toggle = (key: keyof Filters, val: string) =>
    setFilters((p) => ({ ...p, [key]: p[key] === val ? "" : val }));

  const hasFilters   = Object.values(filters).some(Boolean);
  const activeCount  = Object.values(filters).filter(Boolean).length;

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => { setGeoActive(true); setGeoLoading(false); },
      () => setGeoLoading(false),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Barre de recherche sticky ────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Input recherche */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="Titre, professeur, matière…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary-400 focus:bg-white transition-colors"
              />
              {filters.q && (
                <button onClick={() => setFilters((p) => ({ ...p, q: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors ${
                showFilters || hasFilters
                  ? "border-primary-400 bg-primary-50 text-primary-600"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal size={17} />
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-black text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Panneau filtres ── */}
          {showFilters && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              {/* Matière */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Matière</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!filters.subject} onClick={() => setFilters((p) => ({ ...p, subject: "" }))}>Toutes</Chip>
                  {subjects.map((s) => (
                    <Chip key={s.id} active={filters.subject === s.slug} onClick={() => toggle("subject", s.slug)}>
                      {s.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Lieu */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Lieu</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!filters.location_type} onClick={() => setFilters((p) => ({ ...p, location_type: "" }))}>Tous</Chip>
                  <Chip active={filters.location_type === "online"}     onClick={() => toggle("location_type", "online")}>
                    <span className="flex items-center gap-1"><Monitor size={11} /> En ligne</span>
                  </Chip>
                  <Chip active={filters.location_type === "at_teacher"} onClick={() => toggle("location_type", "at_teacher")}>
                    <span className="flex items-center gap-1"><User2 size={11} /> Chez le prof</span>
                  </Chip>
                  <Chip active={filters.location_type === "other"}      onClick={() => toggle("location_type", "other")}>
                    <span className="flex items-center gap-1"><MapPin size={11} /> Autre lieu</span>
                  </Chip>
                  {geoActive ? (
                    <button
                      onClick={() => setGeoActive(false)}
                      className="flex items-center gap-1.5 rounded-full border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700"
                    >
                      <LocateFixed size={11} /> Position active <X size={10} />
                    </button>
                  ) : (
                    <button
                      onClick={handleGeo}
                      disabled={geoLoading}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-primary-400 hover:text-primary-600 disabled:opacity-50"
                    >
                      {geoLoading ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
                      Près de moi
                    </button>
                  )}
                </div>
              </div>

              {/* Date + Prix + Dispo sur une ligne */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip active={!filters.date}               onClick={() => setFilters((p) => ({ ...p, date: "" }))}>Toutes</Chip>
                    <Chip active={filters.date === "today"}    onClick={() => toggle("date", "today")}>Aujourd&apos;hui</Chip>
                    <Chip active={filters.date === "week"}     onClick={() => toggle("date", "week")}>Cette semaine</Chip>
                    <Chip active={filters.date === "upcoming"} onClick={() => toggle("date", "upcoming")}>À venir</Chip>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Prix</p>
                  <div className="flex gap-1.5">
                    <Chip active={!filters.price}           onClick={() => setFilters((p) => ({ ...p, price: "" }))}>Tous</Chip>
                    <Chip active={filters.price === "free"} onClick={() => toggle("price", "free")}>Gratuit</Chip>
                    <Chip active={filters.price === "paid"} onClick={() => toggle("price", "paid")}>Payant</Chip>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Disponibilité</p>
                  <div className="flex gap-1.5">
                    <Chip active={!filters.status}           onClick={() => setFilters((p) => ({ ...p, status: "" }))}>Toutes</Chip>
                    <Chip active={filters.status === "open"} onClick={() => toggle("status", "open")}>Places dispo</Chip>
                    <Chip active={filters.status === "full"} onClick={() => toggle("status", "full")}>Complet</Chip>
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => setFilters(EMPTY)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  <X size={12} /> Réinitialiser tous les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Résultats ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Compteur */}
        {!loading && (
          <p className="mb-4 text-xs text-gray-400">
            {total === 0
              ? "Aucune session trouvée"
              : <><strong className="text-gray-600">{total}</strong> session{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}</>
            }
            {filters.q && <> · Recherche : &quot;<strong className="text-gray-600">{filters.q}</strong>&quot;</>}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <Calendar size={40} className="text-gray-200" />
            <p className="mt-4 font-semibold text-gray-500">Aucune session trouvée</p>
            <p className="mt-1 text-sm text-gray-400">Essayez d&apos;autres critères de recherche</p>
            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY)}
                className="mt-5 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Voir toutes les sessions
              </button>
            )}
          </div>
        ) : (
          /* ── Grille 2 colonnes desktop ── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
            {items.map((s) => (
              <SessionCard key={`event-${s.id}`} s={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
