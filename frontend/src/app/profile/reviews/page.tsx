"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { bookings as bookingsApi } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { Booking } from "@/types";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? "fill-accent-400 text-accent-400" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) {
      bookingsApi.list()
        .then((res) => {
          const done = (res.results ?? []).filter((b) => b.status === "completed");
          setCompletedBookings(done);
        })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mes avis</h1>
      </div>

      <div className="mb-5 rounded-2xl bg-accent-50 border border-accent-100 p-4">
        <p className="text-sm font-medium text-accent-800">
          Partagez votre expérience avec vos professeurs pour aider la communauté KalanConnect.
        </p>
      </div>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : completedBookings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
          <Star size={32} className="text-gray-300" />
          <div>
            <p className="font-semibold text-gray-600">Aucun cours terminé</p>
            <p className="mt-1 text-sm text-gray-400">
              Terminez un cours pour laisser un avis
            </p>
          </div>
          <Link href="/search" className="btn-primary">
            Trouver un professeur
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {completedBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{booking.subject_name ?? "Cours"}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{booking.teacher_name ?? "Professeur"}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{booking.date}</p>
                </div>
                <Link
                  href={`/teachers/${booking.teacher}/review?booking=${booking.id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-600 transition-colors"
                >
                  <MessageSquare size={12} />
                  Donner un avis
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
