"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Star,
  Phone, MessageCircle, User, X, ChevronRight,
  CheckCircle2, XCircle, Flag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { bookings as bookingsApi, chat as chatApi } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Avatar from "@/components/ui/Avatar";
import toast from "react-hot-toast";
import type { Booking } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending:   { label: "En attente", dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"  },
  confirmed: { label: "Confirmé",   dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"   },
  completed: { label: "Terminé",    dot: "bg-primary-500", text: "text-primary-700", bg: "bg-primary-50", border: "border-primary-200" },
  cancelled: { label: "Annulé",     dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"    },
};

const TABS = [
  { key: "all",       label: "Tout"     },
  { key: "upcoming",  label: "À venir"  },
  { key: "completed", label: "Terminés" },
  { key: "cancelled", label: "Annulés"  },
];

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Booking detail modal ───────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  isTeacher,
  onClose,
  onBookingUpdated,
  onRefresh,
}: {
  booking: Booking;
  isTeacher: boolean;
  onClose: () => void;
  onBookingUpdated: (updated: Booking) => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Pour le prof : contacter l'élève/parent
  const openChatWithParent = async () => {
    if (!booking.parent?.id) return;
    setChatLoading(true);
    try {
      const conv = await chatApi.startConversation(booking.parent.id);
      onClose();
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error("Impossible d'ouvrir le chat");
    } finally {
      setChatLoading(false);
    }
  };

  // Pour le parent/étudiant : contacter le prof
  const openChatWithTeacher = async () => {
    if (!booking.teacher_user_id) return;
    setChatLoading(true);
    try {
      const conv = await chatApi.startConversation(booking.teacher_user_id);
      onClose();
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error("Impossible d'ouvrir le chat");
    } finally {
      setChatLoading(false);
    }
  };

  const handleAction = async (action: "confirm" | "cancel" | "complete") => {
    setActionLoading(action);
    try {
      const updated = await bookingsApi.action(booking.id, action);
      onBookingUpdated(updated);
      toast.success(
        action === "confirm"  ? "Réservation confirmée !" :
        action === "complete" ? "Cours marqué comme terminé !" :
        "Réservation annulée"
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? ((err as { data: Record<string, string> }).data?.error ?? "Une erreur est survenue")
          : "Une erreur est survenue";
      toast.error(msg);
      // Re-sync the UI with actual DB state in case the booking was stale
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const canContact = ["pending", "confirmed"].includes(booking.status);
  const parentName = booking.parent
    ? `${booking.parent.first_name} ${booking.parent.last_name}`
    : "Élève";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-900">Détail de la réservation</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          {/* ── Vue PROF : infos de l'élève/parent ── */}
          {isTeacher ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Élève / Parent</p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={booking.parent?.avatar ?? null}
                  firstName={booking.parent?.first_name ?? "E"}
                  lastName={booking.parent?.last_name ?? ""}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{parentName}</p>
                  {booking.parent?.phone && (
                    <p className="text-sm text-gray-500">{booking.parent.phone}</p>
                  )}
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{booking.parent?.role ?? ""}</p>
                </div>
              </div>

              {canContact && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openChatWithParent}
                    disabled={chatLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {chatLoading
                      ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <MessageCircle size={13} />}
                    Envoyer un message
                  </button>
                  {booking.parent?.phone && (
                    <>
                      <a
                        href={`tel:${booking.parent.phone}`}
                        className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 transition-colors"
                      >
                        <Phone size={13} /> Appeler
                      </a>
                      <a
                        href={`https://wa.me/${booking.parent.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Vue PARENT/ÉTUDIANT : infos du prof ── */
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Professeur</p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={booking.teacher_avatar ?? null}
                  firstName={booking.teacher_name?.split(" ")[0] ?? "P"}
                  lastName={booking.teacher_name?.split(" ")[1] ?? ""}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{booking.teacher_name ?? "Professeur"}</p>
                  {booking.teacher_phone && (
                    <p className="text-sm text-gray-500">{booking.teacher_phone}</p>
                  )}
                  {booking.teacher_city && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {booking.teacher_city}
                    </p>
                  )}
                </div>
              </div>

              {canContact && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openChatWithTeacher}
                    disabled={chatLoading || !booking.teacher_user_id}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {chatLoading
                      ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <MessageCircle size={13} />}
                    Envoyer un message
                  </button>
                  {booking.teacher_phone && (
                    <>
                      <a
                        href={`tel:${booking.teacher_phone}`}
                        className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 transition-colors"
                      >
                        <Phone size={13} /> Appeler
                      </a>
                      <a
                        href={`https://wa.me/${booking.teacher_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    </>
                  )}
                  <Link
                    href={`/teachers/${booking.teacher}`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <User size={13} /> Voir le profil
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Booking details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Matière</p>
              <p className="text-sm font-bold text-gray-800">{booking.subject_name ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{fmtDate(booking.date)}</p>
            </div>
            {booking.start_time && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Horaire</p>
                <p className="text-sm font-bold text-gray-800">
                  {booking.start_time.slice(0, 5)} – {booking.end_time?.slice(0, 5)}
                </p>
              </div>
            )}
            {booking.price > 0 && (
              <div className="rounded-xl bg-primary-50 p-3">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1">Montant</p>
                <p className="text-sm font-bold text-primary-700">{booking.price.toLocaleString("fr-FR")} FCFA</p>
              </div>
            )}
            {booking.location_type && (
              <div className="rounded-xl bg-gray-50 p-3 col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Lieu</p>
                <p className="text-sm font-bold text-gray-800">
                  {booking.location_type === "online" ? "En ligne" :
                   booking.location_type === "at_teacher" ? "Chez le professeur" : "À domicile"}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes?.trim() && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                {isTeacher ? "Message de l'élève" : "Votre message"}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-2">
          {/* Actions prof */}
          {isTeacher && booking.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("confirm")}
                disabled={!!actionLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "confirm"
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <CheckCircle2 size={15} />}
                Confirmer
              </button>
              <button
                onClick={() => handleAction("cancel")}
                disabled={!!actionLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "cancel"
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                  : <XCircle size={15} />}
                Refuser
              </button>
            </div>
          )}

          {isTeacher && booking.status === "confirmed" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("complete")}
                disabled={!!actionLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "complete"
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <Flag size={15} />}
                Marquer terminé
              </button>
              <button
                onClick={() => handleAction("cancel")}
                disabled={!!actionLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "cancel"
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                  : <XCircle size={15} />}
                Annuler
              </button>
            </div>
          )}

          {/* Avis (parent/étudiant uniquement) */}
          {!isTeacher && booking.status === "completed" && (
            <Link
              href={`/teachers/${booking.teacher}/review?booking=${booking.id}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent-500 py-3 text-sm font-bold text-white hover:bg-accent-600 transition-colors"
            >
              <Star size={15} /> Laisser un avis
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter();
  const { loading, isLoggedIn, isTeacher } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) {
      bookingsApi.list()
        .then((res) => setAllBookings(res.results ?? []))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [isLoggedIn]);

  const refreshBookings = () => {
    bookingsApi.list()
      .then((res) => {
        const fresh = res.results ?? [];
        setAllBookings(fresh);
        // Sync selected booking if open
        setSelectedBooking((prev) => prev ? (fresh.find((b) => b.id === prev.id) ?? null) : null);
      })
      .catch(() => {});
  };

  const handleBookingUpdated = (updated: Booking) => {
    setAllBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setSelectedBooking(updated);
  };

  if (loading) return <PageLoader />;

  const filtered = allBookings.filter((b) => {
    if (tab === "upcoming")  return ["pending", "confirmed"].includes(b.status);
    if (tab === "completed") return b.status === "completed";
    if (tab === "cancelled") return b.status === "cancelled";
    return true;
  });

  return (
    <>
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isTeacher={!!isTeacher}
          onClose={() => setSelectedBooking(null)}
          onBookingUpdated={handleBookingUpdated}
          onRefresh={refreshBookings}
        />
      )}

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Mes réservations</h1>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse bg-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <CalendarDays size={32} className="text-gray-300" />
            <div>
              <p className="font-semibold text-gray-600">Aucune réservation</p>
              <p className="mt-1 text-sm text-gray-400">dans cette catégorie</p>
            </div>
            {!isTeacher && (
              <Link href="/search" className="btn-primary">
                Trouver un professeur
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const isActionable = isTeacher && ["pending", "confirmed"].includes(booking.status);
              const personName = isTeacher
                ? (booking.parent ? `${booking.parent.first_name} ${booking.parent.last_name}` : "Élève")
                : (booking.teacher_name ?? "Professeur");

              return (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full text-left rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <span className="text-xs font-medium uppercase leading-none">
                          {booking.date ? new Date(booking.date).toLocaleDateString("fr-FR", { month: "short" }) : "—"}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {booking.date ? new Date(booking.date).getDate() : "—"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{booking.subject_name ?? "Cours"}</p>
                        <p className="text-sm text-gray-500 truncate">{personName}</p>
                        {booking.start_time && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {booking.start_time.slice(0, 5)}–{booking.end_time?.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {isActionable && (
                        <span className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                          Action requise <ChevronRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
