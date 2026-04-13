"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, CalendarDays, TrendingUp, Users, Clock, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";

interface TeacherStats {
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  avg_rating: number;
  total_reviews: number;
  total_students: number;
  response_time_hours: number;
}

export default function StatsPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/me/stats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const completionRate = stats && stats.total_bookings > 0
    ? Math.round((stats.completed_bookings / stats.total_bookings) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Mes statistiques</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6">
        {fetching ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : !stats ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">Statistiques non disponibles</p>
            <p className="mt-1 text-sm text-gray-400">Complétez votre profil et recevez vos premières réservations</p>
          </div>
        ) : (
          <>
            {/* Rating highlight */}
            <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-200">Note moyenne</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold">
                      {stats.avg_rating ? stats.avg_rating.toFixed(1) : "—"}
                    </span>
                    <span className="text-2xl text-indigo-300">/ 5</span>
                  </div>
                  <p className="mt-1 text-sm text-indigo-200">
                    Basé sur {stats.total_reviews} avis
                  </p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                  <Star size={36} className="fill-accent-400 text-accent-400" />
                </div>
              </div>
              {/* Star bar */}
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i <= Math.round(stats.avg_rating) ? "bg-accent-400" : "bg-white/20"}`} />
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              {[
                { icon: CalendarDays, label: "Total réservations", value: stats.total_bookings, color: "bg-blue-100 text-blue-600"    },
                { icon: Award,        label: "Cours terminés",     value: stats.completed_bookings, color: "bg-primary-100 text-primary-600" },
                { icon: Users,        label: "Élèves",             value: stats.total_students ?? "—", color: "bg-purple-100 text-purple-600"  },
                { icon: Clock,        label: "Taux de complétion", value: `${completionRate}%`, color: "bg-accent-100 text-accent-600"   },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Booking breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-gray-700">Détail des réservations</h2>
              <div className="space-y-3">
                {[
                  { label: "En attente",  value: stats.pending_bookings,   color: "bg-amber-400"   },
                  { label: "Confirmées",  value: stats.confirmed_bookings,  color: "bg-blue-500"    },
                  { label: "Terminées",   value: stats.completed_bookings,  color: "bg-primary-500" },
                ].map(({ label, value, color }) => {
                  const pct = stats.total_bookings > 0 ? Math.round((value / stats.total_bookings) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-600">{label}</span>
                        <span className="font-bold text-gray-900">{value} <span className="font-normal text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
