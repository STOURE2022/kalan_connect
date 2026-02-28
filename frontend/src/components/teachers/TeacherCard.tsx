"use client";

import Link from "next/link";
import { MapPin, Clock, CheckCircle2, Monitor, Home } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { formatPrice, truncate } from "@/lib/utils";
import type { TeacherListItem } from "@/types";

interface TeacherCardProps {
  teacher: TeacherListItem;
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <Link href={`/teachers/${teacher.id}`}>
      <article className="card group cursor-pointer">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            <Avatar
              src={teacher.photo}
              firstName={teacher.user.first_name}
              lastName={teacher.user.last_name}
              size="lg"
              className="rounded-xl"
            />
          </div>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            {/* Nom + badge */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  {teacher.user.first_name} {teacher.user.last_name}
                </h3>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {teacher.subjects.slice(0, 3).map((s) => (
                    <span key={s} className="badge-green">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {teacher.is_featured && (
                <span className="badge-yellow">Top</span>
              )}
            </div>

            {/* Rating */}
            <div className="mt-1.5">
              <StarRating
                rating={teacher.avg_rating}
                reviewCount={teacher.total_reviews}
                size={14}
              />
            </div>

            {/* Localisation */}
            <div className="mt-1.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} className="text-gray-400" />
              <span>
                {teacher.neighborhood}, {teacher.city}
                {teacher.distance_km && (
                  <span className="text-primary-600">
                    {" "}
                    ({teacher.distance_km.toFixed(1)} km)
                  </span>
                )}
              </span>
            </div>

            {/* Footer : prix + badges */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(teacher.hourly_rate)}
                <span className="text-sm font-normal text-gray-400">/h</span>
              </span>

              <div className="flex items-center gap-2">
                {teacher.is_verified && (
                  <span className="flex items-center gap-0.5 text-xs text-primary-600">
                    <CheckCircle2 size={14} />
                    Verifie
                  </span>
                )}
                {teacher.teaches_online && (
                  <span className="flex items-center gap-0.5 text-xs text-blue-500">
                    <Monitor size={14} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
