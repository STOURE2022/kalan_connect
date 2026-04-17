"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, MapPin, Monitor, Users, User2,
  CheckCircle2, XCircle, Loader2, AlertCircle, Lock,
} from "lucide-react";
import { sessions as sessionsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import type { GroupSession } from "@/types";

const LOCATION_LABELS: Record<string, { icon: React.ElementType; label: string }> = {
  online:     { icon: Monitor, label: "En ligne"           },
  at_teacher: { icon: User2,   label: "Chez le professeur" },
  other:      { icon: MapPin,  label: "Autre lieu"         },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn, isTeacher, hasSubscription } = useAuth();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [loading, setLoading]   = useState(true);
  const [acting,  setActing]    = useState(false);

  useEffect(() => {
    sessionsApi.getById(Number(id))
      .then(setSession)
      .catch(() => router.push("/events"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <PageLoader />;
  if (!session) return null;

  const loc    = LOCATION_LABELS[session.location_type] ?? LOCATION_LABELS.online;
  const LocIcon = loc.icon;
  const isFull = session.status === "full";
  const isClosed = ["cancelled", "completed"].includes(session.status);

  const handleRegister = async () => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (!hasSubscription) { router.push("/payment"); return; }
    setActing(true);
    try {
      if (session.is_registered) {
        const updated = await sessionsApi.unregister(session.id);
        setSession(updated);
        toast.success("Inscription annulée — une place vient d'être libérée");
      } else {
        const updated = await sessionsApi.register(session.id);
        setSession(updated);
        toast.success("Inscription confirmée !");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Back */}
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={18} /> Retour
        </button>

        {/* Card principale */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-50 p-5">
            <div className="flex items-start gap-4">
              <Avatar
                src={session.teacher.photo}
                firstName={session.teacher.first_name}
                lastName={session.teacher.last_name}
                size="lg"
                className="flex-shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900">{session.title}</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  {session.teacher.first_name} {session.teacher.last_name}
                </p>
                <span className="mt-2 inline-block rounded-lg bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                  {session.subject.name}
                </span>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{session.description}</p>
            )}
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-3 p-5">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Date</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800 capitalize">
                <Calendar size={13} className="text-primary-400" /> {fmtDate(session.date)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Horaire</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Clock size={13} className="text-primary-400" /> {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Lieu</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <LocIcon size={13} className="text-primary-400" /> {loc.label}
              </p>
              {session.address && <p className="mt-0.5 text-xs text-gray-400">{session.address}</p>}
            </div>
            <div className="rounded-xl bg-gray-50 p-3 col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Places disponibles</p>
                <p className={`text-xs font-bold ${session.spots_left === 0 ? "text-red-500" : "text-primary-600"}`}>
                  {session.spots_left === 0 ? "Complet !" : `${session.spots_left} place${session.spots_left > 1 ? "s" : ""} restante${session.spots_left > 1 ? "s" : ""}`}
                </p>
              </div>
              {/* Barre de progression */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    session.spots_left === 0
                      ? "bg-red-500"
                      : session.participants_count / session.max_participants >= 0.7
                        ? "bg-amber-500"
                        : "bg-primary-500"
                  }`}
                  style={{ width: `${Math.min(100, (session.participants_count / session.max_participants) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={10} /> {session.participants_count} inscrit{session.participants_count > 1 ? "s" : ""}</span>
                <span>max {session.max_participants}</span>
              </div>
            </div>
          </div>

          {/* Prix + CTA */}
          {!isClosed && !isTeacher && (
            <div className="border-t border-gray-50 p-5">
              {!isLoggedIn || !hasSubscription ? (
                /* Banner abonnement requis */
                <div className="flex flex-col items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Lock size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Abonnement requis</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      S&apos;inscrire à une session nécessite un abonnement actif
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(isLoggedIn ? "/payment" : "/auth/login")}
                    className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-600 transition-colors"
                  >
                    {isLoggedIn ? "Voir les abonnements" : "Se connecter"}
                  </button>
                </div>
              ) : (
                /* CTA normal */
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {session.price_per_student === 0 ? (
                          <span className="text-primary-600">Gratuit</span>
                        ) : (
                          <>{formatPrice(session.price_per_student)}<span className="text-sm font-normal text-gray-400">/élève</span></>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleRegister}
                      disabled={acting || (isFull && !session.is_registered)}
                      className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                        session.is_registered
                          ? "bg-red-500 hover:bg-red-600"
                          : isFull
                            ? "bg-gray-300"
                            : "bg-primary-500 hover:bg-primary-600"
                      }`}
                    >
                      {acting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : session.is_registered ? (
                        <><XCircle size={16} /> Se désinscrire</>
                      ) : isFull ? (
                        <><AlertCircle size={16} /> Complet</>
                      ) : (
                        <><CheckCircle2 size={16} /> S&apos;inscrire</>
                      )}
                    </button>
                  </div>
                  {session.is_registered && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-600">
                      <CheckCircle2 size={14} /> Vous êtes inscrit(e) à cette session
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {isClosed && (
            <div className="border-t border-gray-50 bg-gray-50 p-4 text-center text-sm text-gray-400">
              {session.status === "cancelled" ? "Cette session a été annulée" : "Cette session est terminée"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
