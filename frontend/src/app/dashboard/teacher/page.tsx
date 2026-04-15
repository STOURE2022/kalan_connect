"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, XCircle, Clock, Star,
  MessageCircle, TrendingUp, Users, Edit3, Award,
  ChevronRight, Bell, Shield, AlertTriangle, Wifi,
  Home, BookOpen, ArrowRight, MessageSquare, X,
  MapPin, Phone, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { bookings as bookingsApi, chat as chatApi } from "@/lib/api";
import { getAccessToken } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Booking } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────
function apiGet(path: string) {
  const token = getAccessToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
}

function isToday(dateStr: string) {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

function isThisWeek(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d <= endOfWeek;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:   { label: "En attente", dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50"   },
  confirmed: { label: "Confirmé",   dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50"    },
  completed: { label: "Terminé",    dot: "bg-primary-500", text: "text-primary-700", bg: "bg-primary-50" },
  cancelled: { label: "Annulé",     dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50"     },
};

interface TeacherData {
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
  hourly_rate: number;
  bio: string;
  teaches_online: boolean;
  teaches_at_home: boolean;
  teaches_at_student: boolean;
  diplomas?: { id: number }[];
  availabilities?: { id: number }[];
}

interface StudentItem {
  student: { id: number; first_name: string; last_name: string; phone?: string; avatar?: string | null; role: string };
  total_sessions: number;
  last_session: string | null;
}

function completionScore(td: TeacherData | null): { score: number; missing: string[] } {
  if (!td) return { score: 0, missing: ["Créer votre profil"] };
  const checks = [
    { ok: !!td.bio && td.bio.length > 50,                                    label: "Bio complète"          },
    { ok: td.hourly_rate > 0,                                                 label: "Tarif horaire"         },
    { ok: (td.diplomas?.length ?? 0) > 0,                                    label: "Diplôme ajouté"        },
    { ok: (td.availabilities?.length ?? 0) > 0,                              label: "Disponibilités"        },
    { ok: td.teaches_online || td.teaches_at_home || td.teaches_at_student,  label: "Mode d'enseignement"   },
  ];
  const done = checks.filter((c) => c.ok);
  return { score: Math.round((done.length / checks.length) * 100), missing: checks.filter((c) => !c.ok).map((c) => c.label) };
}

// ── Booking detail modal ──────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
  onConfirm,
  onReject,
  loading,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const openChat = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-900">Détail de la demande</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Parent info + contact */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {booking.parent?.first_name?.[0]}{booking.parent?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{booking.parent?.first_name} {booking.parent?.last_name}</p>
                {booking.parent?.phone && (
                  <p className="text-xs text-gray-500">{booking.parent.phone}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openChat}
                disabled={chatLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors"
              >
                {chatLoading
                  ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <MessageCircle size={13} />}
                Envoyer un message
              </button>
              {booking.parent?.phone && (
                <a
                  href={`tel:${booking.parent.phone}`}
                  className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <Phone size={13} /> Appeler
                </a>
              )}
            </div>
          </div>

          {/* Cours info */}
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
                  {booking.start_time.slice(0,5)} – {booking.end_time?.slice(0,5)}
                </p>
              </div>
            )}
            {booking.price > 0 && (
              <div className="rounded-xl bg-primary-50 p-3">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1">Montant</p>
                <p className="text-sm font-bold text-primary-700">{booking.price.toLocaleString()} FCFA</p>
              </div>
            )}
          </div>

          {/* Message du parent */}
          {booking.notes?.trim() ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Message du parent</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{booking.notes}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <MessageSquare size={14} className="text-gray-300" />
              <p className="text-sm text-gray-400 italic">Aucun message joint à la demande</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <XCircle size={15} /> Refuser
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 size={15} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student contact modal ─────────────────────────────────────────────────────
function StudentContactModal({
  student,
  totalSessions,
  lastSession,
  onClose,
}: {
  student: StudentItem["student"];
  totalSessions: number;
  lastSession: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const openChat = async () => {
    setChatLoading(true);
    try {
      const conv = await chatApi.startConversation(student.id);
      onClose();
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error("Impossible d'ouvrir le chat");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-900">Contact parent</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-600">
              {student.first_name?.[0] ?? "?"}{student.last_name?.[0] ?? ""}
            </div>
            <div>
              <p className="font-bold text-gray-900">{student.first_name} {student.last_name}</p>
              {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
              <p className="text-xs text-gray-400">{totalSessions} cours terminé{totalSessions > 1 ? "s" : ""}</p>
              {lastSession && <p className="text-xs text-gray-300">Dernier : {new Date(lastSession).toLocaleDateString("fr-FR")}</p>}
            </div>
          </div>

          {/* Contact actions */}
          <div className="space-y-2">
            {/* Chat — toujours disponible */}
            <button
              onClick={openChat}
              disabled={chatLoading}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors"
            >
              {chatLoading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <MessageCircle size={16} />}
              Envoyer un message
            </button>

            {/* Phone — si disponible */}
            {student.phone ? (
              <>
                <a
                  href={`tel:${student.phone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary-200 bg-primary-50 py-3 text-sm font-bold text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  <Phone size={16} /> Appeler
                </a>
                <a
                  href={`https://wa.me/${student.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-center text-xs text-gray-400">
                Numéro de téléphone non renseigné 📴
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, loading, isLoggedIn, isTeacher } = useAuth();

  const [teacherData, setTeacherData]     = useState<TeacherData | null>(null);
  const [allBookings, setAllBookings]     = useState<Booking[]>([]);
  const [students, setStudents]           = useState<StudentItem[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifCount, setNotifCount]       = useState(0);
  const [fetching, setFetching]           = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isTeacher)) router.push("/auth/login");
  }, [loading, isLoggedIn, isTeacher, router]);

  const loadData = useCallback(async () => {
    try {
      const [td, bk] = await Promise.allSettled([
        apiGet("/teachers/me/"),
        bookingsApi.list(),
      ]);
      if (td.status === "fulfilled") setTeacherData(td.value);
      if (bk.status === "fulfilled") setAllBookings(bk.value.results ?? []);
      apiGet("/teachers/me/students/").then((d) => setStudents(d.results ?? d ?? [])).catch(() => {});
      apiGet("/notifications/?limit=20").then((d) => {
        const list = d.results ?? d ?? [];
        setNotifCount(Array.isArray(list) ? list.filter((n: { is_read: boolean }) => !n.is_read).length : 0);
      }).catch(() => {});
      chatApi.getConversations().then((d) => {
        const convs = d.results ?? [];
        setUnreadCount(convs.reduce((acc: number, c: { unread_count?: number }) => acc + (c.unread_count ?? 0), 0));
      }).catch(() => {});
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { if (isLoggedIn) loadData(); }, [isLoggedIn, loadData]);

  const handleAction = async (bookingId: number, action: "confirm" | "cancel") => {
    setActionLoading(bookingId);
    try {
      await bookingsApi.action(bookingId, action);
      toast.success(action === "confirm" ? "Réservation confirmée !" : "Réservation refusée");
      setSelectedBooking(null);
      // Re-fetch complet pour mettre à jour tous les compteurs et sections
      await loadData();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user || fetching) return <PageLoader />;

  const pending        = allBookings.filter((b) => b.status === "pending");
  const todayCourses   = allBookings.filter((b) => ["pending", "confirmed"].includes(b.status) && isToday(b.date));
  const weekCourses    = allBookings.filter((b) => ["confirmed"].includes(b.status) && isThisWeek(b.date) && !isToday(b.date));
  const completed      = allBookings.filter((b) => b.status === "completed");
  const monthRevenue   = completed
    .filter((b) => { const d = new Date(b.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .reduce((acc, b) => acc + (b.price ?? 0), 0);

  const { score, missing } = completionScore(teacherData);

  return (
    <>
      {/* Booking modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onConfirm={() => handleAction(selectedBooking.id, "confirm")}
          onReject={() => handleAction(selectedBooking.id, "cancel")}
          loading={actionLoading === selectedBooking.id}
        />
      )}

      {/* Student contact modal */}
      {selectedStudent && (
        <StudentContactModal
          student={selectedStudent.student}
          totalSessions={selectedStudent.total_sessions}
          lastSession={selectedStudent.last_session}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-600 to-primary-500 px-4 pb-20 pt-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative mx-auto max-w-3xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} size="lg" className="ring-4 ring-white/30" />
                  {teacherData?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-400">
                      <Shield size={11} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-indigo-200">Bonjour 👋</p>
                  <h1 className="text-lg font-bold text-white">{user.first_name} {user.last_name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {teacherData?.is_verified ? (
                      <span className="flex items-center gap-1 rounded-full bg-primary-400/30 px-2.5 py-0.5 text-xs font-semibold text-white"><CheckCircle2 size={10} /> Vérifié</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-400/30 px-2.5 py-0.5 text-xs font-semibold text-white"><Clock size={10} /> En attente</span>
                    )}
                    {teacherData?.teaches_online && <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs text-indigo-100"><Wifi size={10} /> En ligne</span>}
                    {teacherData?.teaches_at_home && <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs text-indigo-100"><Home size={10} /> Domicile</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {notifCount > 0 && (
                  <Link href="/profile/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
                    <Bell size={18} className="text-white" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{notifCount}</span>
                  </Link>
                )}
                {unreadCount > 0 && (
                  <Link href="/chat" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
                    <MessageCircle size={18} className="text-white" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>
                  </Link>
                )}
                <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
                  <Edit3 size={16} className="text-white" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[
                { label: "Note",    value: teacherData?.avg_rating ? `${teacherData.avg_rating.toFixed(1)}★` : "—", color: "text-accent-300"  },
                { label: "Avis",    value: teacherData?.total_reviews ?? "—",  color: "text-white"       },
                { label: "Cours",   value: completed.length,                   color: "text-white"       },
                { label: "Ce mois", value: monthRevenue > 0 ? `${(monthRevenue / 1000).toFixed(0)}K` : "—", color: "text-primary-200" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className={`text-lg font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-indigo-200">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4">

          {/* ── Profile completion ── */}
          {score < 100 && (
            <div className="relative z-10 -mt-6 mb-5">
              <Link href="/profile/teacher/edit" className="group block overflow-hidden rounded-2xl bg-white shadow-lg shadow-indigo-500/10 border border-indigo-100">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                    <AlertTriangle size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Profil complété à {score}%</p>
                      <span className="text-xs text-indigo-600 font-semibold">Compléter →</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary-500 transition-all" style={{ width: `${score}%` }} />
                    </div>
                    {missing.length > 0 && (
                      <p className="mt-1.5 text-xs text-gray-400">Manque : {missing.slice(0, 2).join(" · ")}{missing.length > 2 ? ` +${missing.length - 2}` : ""}</p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── Pending bookings ── */}
          {pending.length > 0 && (
            <div className={`mb-5 ${score < 100 ? "" : "relative z-10 -mt-6"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">{pending.length}</span>
                  À confirmer
                </h2>
                <Link href="/profile/bookings" className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
                  Tout voir <ChevronRight size={13} />
                </Link>
              </div>
              <div className="space-y-3">
                {pending.map((booking) => (
                  <div
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-md shadow-amber-500/10"
                  >
                    {/* Clickable top part → opens modal */}
                    <button
                      className="w-full text-left"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <span className="text-xs font-medium leading-none uppercase">
                            {new Date(booking.date).toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                          <span className="text-xl font-bold leading-none">{new Date(booking.date).getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{booking.subject_name ?? "Cours"}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {booking.parent?.first_name} {booking.parent?.last_name}
                          </p>
                          {booking.start_time && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Clock size={10} /> {booking.start_time.slice(0, 5)} – {booking.end_time?.slice(0, 5)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          {booking.price > 0 && (
                            <p className="text-sm font-bold text-primary-600">{booking.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600">
                            <ExternalLink size={10} /> Voir détail
                          </span>
                        </div>
                      </div>

                      {/* Message preview */}
                      {booking.notes?.trim() && (
                        <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                          <MessageSquare size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{booking.notes}</p>
                        </div>
                      )}
                    </button>

                    {/* Action buttons */}
                    <div className="flex border-t border-amber-100">
                      <button
                        onClick={() => handleAction(booking.id, "cancel")}
                        disabled={actionLoading === booking.id}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={15} /> Refuser
                      </button>
                      <div className="w-px bg-amber-100" />
                      <button
                        onClick={() => handleAction(booking.id, "confirm")}
                        disabled={actionLoading === booking.id}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === booking.id
                          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                          : <CheckCircle2 size={15} />
                        }
                        Confirmer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Today's courses ── */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                Cours aujourd&apos;hui
                {todayCourses.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{todayCourses.length}</span>
                )}
              </h2>
              <Link href="/profile/bookings" className="flex items-center gap-1 text-sm font-medium text-primary-600">
                Tout voir <ArrowRight size={13} />
              </Link>
            </div>

            {todayCourses.length === 0 ? (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-5 py-4">
                <CalendarDays size={24} className="text-gray-300" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Pas de cours aujourd&apos;hui</p>
                  <p className="text-xs text-gray-400">
                    {weekCourses.length > 0 ? `${weekCourses.length} cours confirmé${weekCourses.length > 1 ? "s" : ""} cette semaine` : "Votre planning est libre"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCourses.map((booking) => {
                  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.confirmed;
                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-left hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Clock size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{booking.subject_name ?? "Cours"}</p>
                        <p className="text-sm text-gray-500">{booking.parent?.first_name} {booking.parent?.last_name}</p>
                        {booking.start_time && (
                          <p className="text-xs text-gray-400 mt-0.5">{booking.start_time.slice(0, 5)} – {booking.end_time?.slice(0, 5)}</p>
                        )}
                      </div>
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── This week ── */}
          {weekCourses.length > 0 && (
            <div className="mb-5">
              <h2 className="mb-3 text-base font-bold text-gray-900">Cette semaine</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                {weekCourses.slice(0, 5).map((booking) => {
                  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.confirmed;
                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50 text-center">
                        <span className="text-[10px] font-medium uppercase leading-none text-gray-400">
                          {new Date(booking.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold leading-none text-gray-700">{new Date(booking.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{booking.subject_name ?? "Cours"}</p>
                        <p className="text-xs text-gray-400">{booking.start_time?.slice(0, 5)} · {booking.parent?.first_name}</p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Recent students ── */}
          {students.length > 0 && (
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Mes élèves récents</h2>
                <span className="text-sm text-gray-400">{students.length} au total</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {students.slice(0, 6).map((s) => (
                  <button
                    key={s.student.id}
                    onClick={() => setSelectedStudent(s)}
                    className="flex flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm w-24 text-center hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {s.student.first_name?.[0] ?? "?"}{s.student.last_name?.[0] ?? ""}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate w-full">{s.student.first_name}</p>
                    {s.total_sessions > 0 && <p className="text-[10px] text-gray-400">{s.total_sessions} cours</p>}
                    <span className="text-[10px] text-indigo-400 font-medium">Contacter</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick actions ── */}
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Edit3,        label: "Mon profil",     desc: "Bio, tarif, photo",   href: "/profile/teacher/edit",     gradient: "from-indigo-500 to-purple-500"  },
                { icon: Award,        label: "Diplômes",       desc: "Gérer mes diplômes",  href: "/profile/teacher/diplomas",  gradient: "from-blue-500 to-indigo-500"    },
                { icon: CalendarDays, label: "Disponibilités", desc: "Mes créneaux",        href: "/profile/teacher/schedule",  gradient: "from-teal-500 to-primary-500"   },
                { icon: TrendingUp,   label: "Statistiques",   desc: "Revenus, notes",      href: "/profile/stats",             gradient: "from-accent-500 to-orange-400"  },
              ].map(({ icon: Icon, label, desc, href, gradient }) => (
                <Link key={label} href={href} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><Icon size={17} /></div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="mt-0.5 text-xs text-white/70">{desc}</p>
                  <ArrowRight size={13} className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
