"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  BookOpen,
  MapPin,
  Monitor,
  Home,
  User,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Child, Booking } from "@/types";

const TABS = [
  { key: "all",       label: "Tout" },
  { key: "upcoming",  label: "À venir" },
  { key: "completed", label: "Terminés" },
  { key: "cancelled", label: "Annulés" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock },
  confirmed: { label: "Confirmé",    dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle2 },
  completed: { label: "Terminé",     dot: "bg-primary-500", text: "text-primary-700", bg: "bg-primary-50", border: "border-primary-200", icon: CheckCircle2 },
  cancelled: { label: "Annulé",      dot: "bg-red-400",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle },
  no_show:   { label: "Absent",      dot: "bg-gray-400",    text: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle },
};

const LOCATION_ICONS: Record<string, React.ElementType> = {
  online:     Monitor,
  at_teacher: Home,
  at_student: User,
};

const LOCATION_LABELS: Record<string, string> = {
  online:     "En ligne",
  at_teacher: "Chez le prof",
  at_student: "À domicile",
};

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function ChildAgendaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { loading, isLoggedIn, isParent } = useAuth();

  const [child, setChild] = useState<Child | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
    if (!loading && isLoggedIn && !isParent) router.push("/dashboard");
  }, [loading, isLoggedIn, isParent, router]);

  const token = () => getAccessToken();
  const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchAll = async () => {
      try {
        const [childRes, bkRes] = await Promise.all([
          fetch(api(`/children/${id}/`), { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(api("/bookings/"), { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        if (!childRes.ok) { router.push("/profile/children"); return; }
        setChild(await childRes.json());
        const bkData = await bkRes.json();
        const all: Booking[] = Array.isArray(bkData) ? bkData : (bkData.results ?? []);
        setBookings(all.sort((a, b) => b.date.localeCompare(a.date)));
      } catch { toast.error("Erreur de chargement"); }
      finally { setFetching(false); }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, id]);

  if (loading || fetching) return <PageLoader />;
  if (!child) return null;

  const filtered = bookings.filter((b) => {
    if (tab === "upcoming")  return ["pending", "confirmed"].includes(b.status);
    if (tab === "completed") return b.status === "completed";
    if (tab === "cancelled") return ["cancelled", "no_show"].includes(b.status);
    return true;
  });

  // Group by month-year
  const grouped: Record<string, Booking[]> = {};
  filtered.forEach((b) => {
    const d = new Date(b.date);
    const key = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  const upcoming = bookings.filter((b) => ["pending", "confirmed"].includes(b.status));
  const nextCourse = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Agenda · {child.first_name}</h1>
            <p className="text-xs text-gray-400">{bookings.length} cours au total</p>
          </div>
          <Link href="/search" className="btn-primary !py-2 !px-3 text-xs">
            + Réserver
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5 space-y-5">

        {/* Next course banner */}
        {nextCourse && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white shadow-lg">
            <p className="text-xs font-semibold text-white/70 mb-1">Prochain cours</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{nextCourse.subject_name}</p>
                <p className="text-sm text-white/80">{nextCourse.teacher_name}</p>
                <p className="mt-1 text-xs text-white/60">
                  {new Date(nextCourse.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}{nextCourse.start_time.slice(0, 5)}–{nextCourse.end_time.slice(0, 5)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white/20 border border-white/30">
                  <p className="text-xl font-bold leading-none">{new Date(nextCourse.date).getDate()}</p>
                  <p className="text-xs text-white/70">{MONTHS_FR[new Date(nextCourse.date).getMonth()]}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => {
            const count = key === "all" ? bookings.length
              : key === "upcoming" ? bookings.filter((b) => ["pending", "confirmed"].includes(b.status)).length
              : key === "completed" ? bookings.filter((b) => b.status === "completed").length
              : bookings.filter((b) => ["cancelled", "no_show"].includes(b.status)).length;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  tab === key
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Booking list grouped by month */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
              <CalendarDays size={26} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Aucun cours ici</p>
              <p className="mt-1 text-sm text-gray-400">
                {tab === "upcoming" ? "Pas de cours prévu pour l'instant" : "Aucun cours dans cette catégorie"}
              </p>
            </div>
            {tab === "upcoming" && (
              <Link href="/search" className="btn-primary">
                <BookOpen size={14} className="mr-1 inline" /> Trouver un professeur
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">{month}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {items.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    const LocIcon = LOCATION_ICONS[booking.location_type] ?? MapPin;
                    const d = new Date(booking.date);
                    return (
                      <div key={booking.id} className={`rounded-2xl border ${cfg.border} bg-white shadow-sm overflow-hidden`}>
                        <div className="flex items-stretch">
                          {/* Date block */}
                          <div className={`flex w-16 flex-shrink-0 flex-col items-center justify-center ${cfg.bg} py-4`}>
                            <p className="text-xs font-semibold text-gray-500">{DAYS_FR[d.getDay()]}</p>
                            <p className="text-2xl font-black text-gray-900">{d.getDate()}</p>
                            <p className="text-xs font-semibold text-gray-400">{MONTHS_FR[d.getMonth()]}</p>
                          </div>
                          {/* Content */}
                          <div className="flex-1 px-4 py-3.5">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-gray-900">{booking.subject_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{booking.teacher_name}</p>
                              </div>
                              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.text} ${cfg.bg} ${cfg.border}`}>
                                <StatusIcon size={9} /> {cfg.label}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={11} className="text-gray-400" />
                                {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <LocIcon size={11} className="text-gray-400" />
                                {LOCATION_LABELS[booking.location_type]}
                              </span>
                              <span className="ml-auto text-xs font-bold text-gray-700">
                                {booking.price.toLocaleString()} FCFA
                              </span>
                            </div>
                            {booking.notes && (
                              <p className="mt-2 text-xs text-gray-400 italic truncate">"{booking.notes}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
