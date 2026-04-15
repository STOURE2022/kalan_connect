"use client";

import Link from "next/link";
import { MapPin, CheckCircle2, Monitor, Home, Users, Star, Trophy, BookOpen } from "lucide-react";
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
        <div className="relative bg-gradient-to-br from-primary-50 via-primary-100/60 to-emerald-50 px-5 pt-5 pb-4">
          {/* Badges */}
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

          {/* Photo + nom */}
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
            <h3 className="text-sm font-bold text-gray-900 text-center transition-colors group-hover:text-primary-600">
              {teacher.user.first_name} {teacher.user.last_name}
            </h3>
          </div>
        </div>

        {/* ── Corps ── */}
        <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">

          {/* Matières (max 2) */}
          <div className="flex flex-wrap justify-center gap-1">
            {teacher.subjects.slice(0, 2).map((s, i) => (
              <span
                key={s}
                className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}
              >
                {s}
              </span>
            ))}
            {teacher.subjects.length > 2 && (
              <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                +{teacher.subjects.length - 2}
              </span>
            )}
          </div>

          {/* Localisation + distance */}
          <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <MapPin size={10} className="flex-shrink-0 text-gray-300" />
            <span className="truncate">{teacher.city}</span>
            {teacher.distance_km != null && (
              <span className="flex-shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                {teacher.distance_km.toFixed(1)} km
              </span>
            )}
          </p>

          {/* Modes — icônes seulement */}
          <div className="flex justify-center gap-3">
            {teacher.teaches_online && (
              <span title="En ligne" className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <Monitor size={13} />
              </span>
            )}
            {teacher.teaches_at_home && (
              <span title="À domicile" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <Home size={13} />
              </span>
            )}
            {teacher.teaches_at_student && (
              <span title="Chez l'élève" className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                <Users size={13} />
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
                <Star size={12} className="fill-amber-400 text-amber-400" />
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
