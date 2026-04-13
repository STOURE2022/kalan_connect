"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Home,
  Building2,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import { teachers as teachersApi, bookings as bookingsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatPrice, DAYS_FR } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { TeacherProfile } from "@/types";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, hasSubscription } = useAuth();

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [locationType, setLocationType] = useState("at_student");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const teacherId = Number(params.id);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!hasSubscription) {
      router.push("/payment");
      return;
    }
    teachersApi
      .getById(teacherId)
      .then((t) => {
        setTeacher(t);
        // Pre-select first subject
        if (t.teacher_subjects.length > 0) {
          setSelectedSubject(t.teacher_subjects[0].subject.id);
        }
      })
      .finally(() => setLoading(false));
  }, [teacherId, isLoggedIn, hasSubscription, router]);

  if (loading || !teacher) return <PageLoader />;

  const uniqueSubjects = [
    ...new Map(
      teacher.teacher_subjects.map((ts) => [ts.subject.id, ts.subject])
    ).values(),
  ];

  // Generate today + next 13 days
  const nextDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Filter available slots for selected date
  const selectedDayOfWeek = selectedDate
    ? new Date(selectedDate).getDay() || 7 // Sunday = 7
    : null;
  const availableSlots = teacher.availabilities.filter(
    (a) => a.day_of_week === selectedDayOfWeek
  );

  const duration =
    selectedSlot
      ? parseInt(selectedSlot.end) - parseInt(selectedSlot.start)
      : 1;
  const totalPrice = teacher.hourly_rate * Math.max(duration, 1);

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDate || !selectedSlot) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSubmitting(true);
    try {
      await bookingsApi.create({
        teacher: teacher.id,
        subject: selectedSubject,
        date: selectedDate,
        start_time: selectedSlot.start + ":00",
        end_time: selectedSlot.end + ":00",
        location_type: locationType,
        address,
        notes,
      });
      setSuccess(true);
      toast.success("Reservation envoyee !");
    } catch {
      toast.error("Erreur lors de la reservation");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <CheckCircle2 size={40} className="text-primary-500" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Reservation envoyee !
          </h2>
          <p className="mt-2 text-gray-500">
            {teacher.user.first_name} recevra votre demande et vous confirmera
            le cours.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => router.push("/profile/bookings")}
              className="btn-primary"
            >
              Voir mes reservations
            </button>
            <button
              onClick={() => router.push("/search")}
              className="btn-secondary"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Reserver un cours</h1>

      {/* Teacher summary */}
      <div className="card mt-4 flex items-center gap-3">
        <Avatar
          src={teacher.photo}
          firstName={teacher.user.first_name}
          lastName={teacher.user.last_name}
          size="lg"
        />
        <div>
          <h3 className="font-semibold text-gray-900">
            {teacher.user.first_name} {teacher.user.last_name}
          </h3>
          <p className="text-sm text-gray-500">
            {formatPrice(teacher.hourly_rate)}/h
          </p>
        </div>
      </div>

      {/* Subject */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Choisir la matiere
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {uniqueSubjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                selectedSubject === s.id
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Choisir la date
        </h3>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {nextDays.map((d) => {
            const iso = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
            const dayNum = d.getDate();
            const month = d.toLocaleDateString("fr-FR", { month: "short" });
            return (
              <button
                key={iso}
                onClick={() => {
                  setSelectedDate(iso);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "flex flex-shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center transition-all",
                  selectedDate === iso
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <span className="text-xs capitalize">{dayName}</span>
                <span className="text-lg font-bold">{dayNum}</span>
                <span className="text-xs capitalize">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700">
            Choisir le creneau
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => {
                const start = slot.start_time.slice(0, 5);
                const end = slot.end_time.slice(0, 5);
                const isSelected =
                  selectedSlot?.start === start && selectedSlot?.end === end;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot({ start, end })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <Clock size={14} />
                    {start} – {end}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-400">
                Pas de disponibilite ce jour. Contactez le professeur.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">Lieu du cours</h3>
        <div className="mt-2 space-y-2">
          {teacher.teaches_at_student && (
            <button
              onClick={() => setLocationType("at_student")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all",
                locationType === "at_student"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Home size={18} className="text-gray-500" />
              A domicile
            </button>
          )}
          {teacher.teaches_at_home && (
            <button
              onClick={() => setLocationType("at_teacher")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all",
                locationType === "at_teacher"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Building2 size={18} className="text-gray-500" />
              Chez le professeur
            </button>
          )}
          {teacher.teaches_online && (
            <button
              onClick={() => setLocationType("online")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all",
                locationType === "online"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Monitor size={18} className="text-gray-500" />
              En ligne
            </button>
          )}
        </div>
      </div>

      {/* Address */}
      {locationType === "at_student" && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Votre adresse
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Hamdallaye ACI 2000, pres du marche"
            className="input"
          />
        </div>
      )}

      {/* Notes */}
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes pour le professeur (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Niveau de l'eleve, difficultes, objectifs..."
          rows={3}
          className="input resize-none"
        />
      </div>

      {/* Summary */}
      {selectedSubject && selectedDate && selectedSlot && (
        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Recapitulatif</h3>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>
              Prof : {teacher.user.first_name} {teacher.user.last_name}
            </p>
            <p>
              Matiere :{" "}
              {uniqueSubjects.find((s) => s.id === selectedSubject)?.name}
            </p>
            <p>
              Date : {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p>
              Horaire : {selectedSlot.start} – {selectedSlot.end}
            </p>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={
          submitting || !selectedSubject || !selectedDate || !selectedSlot
        }
        className="btn-primary mt-6 w-full gap-2"
      >
        <CalendarDays size={18} />
        {submitting ? "Envoi..." : "Confirmer la reservation"}
      </button>
    </div>
  );
}
