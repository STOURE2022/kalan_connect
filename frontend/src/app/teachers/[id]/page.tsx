"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Monitor,
  Home,
  Building2,
  GraduationCap,
  CalendarDays,
  MessageCircle,
  ArrowLeft,
  Share2,
  Heart,
} from "lucide-react";
import { teachers as teachersApi, bookings as bookingsApi, chat as chatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatPrice, DAYS_FR } from "@/lib/utils";
import type { TeacherProfile, Review } from "@/types";

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, hasSubscription } = useAuth();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherId = Number(params.id);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      teachersApi.getById(teacherId),
      bookingsApi.getReviews(teacherId).catch(() => ({ results: [] })),
    ])
      .then(([t, r]) => {
        setTeacher(t);
        setReviews(r.results);
      })
      .catch(() => router.push("/search"))
      .finally(() => setLoading(false));
  }, [teacherId, router]);

  const handleContact = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!teacher) return;
    try {
      const conv = await chatApi.startConversation(teacher.user.id);
      router.push(`/chat/${conv.id}`);
    } catch {
      // ignore
    }
  };

  if (loading || !teacher) return <PageLoader />;

  // Group subjects by unique name
  const subjectNames = [
    ...new Set(teacher.teacher_subjects.map((ts) => ts.subject.name)),
  ];
  const levelsBySubject = teacher.teacher_subjects.reduce(
    (acc, ts) => {
      if (!acc[ts.subject.name]) acc[ts.subject.name] = [];
      acc[ts.subject.name].push(ts.level.name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Build availability grid
  const availabilityByDay = teacher.availabilities.reduce(
    (acc, a) => {
      if (!acc[a.day_of_week]) acc[a.day_of_week] = [];
      acc[a.day_of_week].push(`${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`);
      return acc;
    },
    {} as Record<number, string[]>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <Share2 size={18} className="text-gray-500" />
          </button>
          <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <Heart size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Profile header */}
      <div className="card mb-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar
            src={teacher.photo}
            firstName={teacher.user.first_name}
            lastName={teacher.user.last_name}
            size="xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {teacher.user.first_name} {teacher.user.last_name}
            </h1>
            <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
              <StarRating
                rating={teacher.avg_rating}
                reviewCount={teacher.total_reviews}
              />
              {teacher.is_verified && (
                <span className="badge-green flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Verifie
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 sm:justify-start">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {teacher.neighborhood}, {teacher.city}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap size={14} />
                {teacher.experience_years} ans d&apos;experience
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Repond en ~{Math.round(teacher.response_time_hours)}h
              </span>
            </div>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(teacher.hourly_rate)}
            </span>
            <span className="text-gray-500"> / heure</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={
                isLoggedIn && hasSubscription
                  ? `/teachers/${teacher.id}/book`
                  : isLoggedIn
                    ? "/payment"
                    : "/auth/login"
              }
              className="btn-primary gap-2"
            >
              <CalendarDays size={16} />
              Reserver un cours
            </Link>
            <button onClick={handleContact} className="btn-secondary gap-2">
              <MessageCircle size={16} />
              Contacter
            </button>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="card mb-4">
        <h2 className="text-lg font-semibold text-gray-900">A propos</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {teacher.bio}
        </p>
      </div>

      {/* Subjects & Levels */}
      <div className="card mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Matieres & Niveaux
        </h2>
        <div className="mt-3 space-y-3">
          {subjectNames.map((name) => (
            <div key={name} className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <GraduationCap size={18} className="text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{name}</h4>
                <p className="text-sm text-gray-500">
                  {levelsBySubject[name].join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teaching modes */}
      <div className="card mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Type de cours</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {teacher.teaches_at_student && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Home size={16} />
              A domicile (rayon {teacher.radius_km} km)
            </div>
          )}
          {teacher.teaches_at_home && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
              <Building2 size={16} />
              Chez le professeur
            </div>
          )}
          {teacher.teaches_online && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <Monitor size={16} />
              En ligne
            </div>
          )}
        </div>
      </div>

      {/* Diplomas */}
      {teacher.diplomas.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Diplomes</h2>
          <div className="mt-3 space-y-3">
            {teacher.diplomas.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-100">
                  <GraduationCap size={18} className="text-accent-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{d.title}</h4>
                  <p className="text-sm text-gray-500">
                    {d.institution} &middot; {d.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div className="card mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Disponibilites</h2>
        <div className="mt-3 space-y-2">
          {Object.entries(availabilityByDay).map(([day, slots]) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-gray-700">
                {DAYS_FR[Number(day)]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {slots.map((slot) => (
                  <span key={slot} className="badge-green">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(availabilityByDay).length === 0 && (
            <p className="text-sm text-gray-400">
              Contactez le professeur pour connaitre ses disponibilites
            </p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Avis ({teacher.total_reviews})
          </h2>
        </div>
        <div className="mt-4 space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={review.parent.avatar}
                      firstName={review.parent.first_name}
                      lastName={review.parent.last_name}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {review.parent.first_name} {review.parent.last_name.charAt(0)}.
                    </span>
                  </div>
                  <StarRating rating={review.rating} size={14} showValue={false} />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">Pas encore d&apos;avis</p>
          )}
        </div>
      </div>
    </div>
  );
}
