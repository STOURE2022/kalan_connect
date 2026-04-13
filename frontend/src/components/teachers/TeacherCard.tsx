"use client";

import Link from "next/link";
import { MapPin, CheckCircle2, Monitor, Home, Users, Star, Trophy, BookOpen, Clock } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { formatPrice } from "@/lib/utils";
import type { TeacherListItem } from "@/types";

const SUBJECT_COLORS = [
  "bg-primary-100 text-primary-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

export default function TeacherCard({ teacher }: { teacher: TeacherListItem }) {
  const hasRating = teacher.total_reviews > 0;

  return (
    <Link href={`/teachers/${teacher.id}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10">

        {/* ── Zone photo ── */}
        <div className="relative bg-gradient-to-br from-primary-50 via-primary-100/60 to-emerald-50 px-5 pt-6 pb-4">
          {/* Badges Top / Concours */}
          <div className="absolute right-3 top-3 flex flex-col gap-1">
            {teacher.is_featured && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Star size={9} className="fill-white" /> Top
              </span>
            )}
            {teacher.is_concours_specialist && (
              <span className="flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Trophy size={9} /> Concours
              </span>
            )}
          </div>

          {/* Photo centrée */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar
                src={teacher.photo}
                firstName={teacher.user.first_name}
                lastName={teacher.user.last_name}
                size="xl"
                className="rounded-2xl ring-4 ring-white shadow-md"
              />
              {teacher.is_verified && (
                <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                  <CheckCircle2 size={16} className="text-primary-500" />
                </div>
              )}
            </div>

            {/* Nom */}
            <div className="text-center">
              <h3 className="text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600">
                {teacher.user.first_name} {teacher.user.last_name}
              </h3>
              {teacher.experience_years > 0 && (
                <p className="flex items-center justify-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <Clock size={10} />
                  {teacher.experience_years} an{teacher.experience_years > 1 ? "s" : ""} d&apos;expérience
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Infos ── */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4">

          {/* Matières */}
          <div className="flex flex-wrap justify-center gap-1">
            {teacher.subjects.slice(0, 3).map((s, i) => (
              <span
                key={s}
                className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}
              >
                {s}
              </span>
            ))}
            {teacher.subjects.length > 3 && (
              <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                +{teacher.subjects.length - 3}
              </span>
            )}
          </div>

          {/* Bio */}
          {teacher.bio && (
            <p className="line-clamp-2 text-center text-xs leading-relaxed text-gray-500">
              {teacher.bio}
            </p>
          )}

          {/* Localisation */}
          <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <MapPin size={11} className="flex-shrink-0 text-gray-300" />
            <span className="truncate">{teacher.neighborhood}, {teacher.city}</span>
            {teacher.distance_km != null && (
              <span className="ml-1 flex-shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                {teacher.distance_km.toFixed(1)} km
              </span>
            )}
          </p>

          {/* Modes d'enseignement */}
          <div className="flex flex-wrap justify-center gap-1">
            {teacher.teaches_online && (
              <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                <Monitor size={10} /> En ligne
              </span>
            )}
            {teacher.teaches_at_home && (
              <span className="flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
                <Home size={10} /> À domicile
              </span>
            )}
            {teacher.teaches_at_student && (
              <span className="flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-600">
                <Users size={10} /> Chez l&apos;élève
              </span>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            {hasRating ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={11}
                      className={i <= Math.round(teacher.avg_rating) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700">{teacher.avg_rating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({teacher.total_reviews})</span>
              </>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <BookOpen size={11} /> Nouveau
              </span>
            )}
          </div>

          {/* Prix + CTA */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <p className="whitespace-nowrap text-sm font-black text-gray-900">
              {formatPrice(teacher.hourly_rate)}<span className="text-[11px] font-normal text-gray-400">/h</span>
            </p>
            <div className="rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-primary-600">
              Voir →
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
