"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, CalendarDays, MessageCircle, CreditCard, BookOpen,
  CheckCircle2, Clock, XCircle, ArrowRight, Star, TrendingUp,
  Bell, ChevronRight, Sparkles, GraduationCap, Zap, Users,
  Baby, Plus, Phone, MapPin, X, User, Trophy, Flame, Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { bookings as bookingsApi, chat as chatApi, concours as concoursApi, stats as statsApi } from "@/lib/api";
import { getAccessToken } from "@/lib/api";
import type { ProgressionStats } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Booking, Child, ConcoursEvent } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; text: string; bg: string; icon: typeof Clock }
> = {
  pending: {
    label: "En attente",
    dot: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmé",
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    icon: CheckCircle2,
  },
  completed: {
    label: "Terminé",
    dot: "bg-primary-500",
    text: "text-primary-700",
    bg: "bg-primary-50",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Annulé",
    dot: "bg-red-400",
    text: "text-red-600",
    bg: "bg-red-50",
    icon: XCircle,
  },
};

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent",
  student: "Élève",
  etudiant: "Étudiant",
  teacher: "Professeur",
  admin: "Admin",
};

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const canContact = ["pending", "confirmed"].includes(booking.status);

  const openChat = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-900">Détail de la réservation</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
          </span>

          {/* Teacher */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Professeur</p>
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={booking.teacher_avatar ?? null} firstName={booking.teacher_name?.split(" ")[0] ?? "P"} lastName={booking.teacher_name?.split(" ")[1] ?? ""} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{booking.teacher_name ?? "Professeur"}</p>
                {booking.teacher_phone && <p className="text-sm text-gray-500">{booking.teacher_phone}</p>}
                {booking.teacher_city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {booking.teacher_city}</p>
                )}
              </div>
            </div>
            {canContact && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openChat}
                  disabled={chatLoading || !booking.teacher_user_id}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {chatLoading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <MessageCircle size={13} />}
                  Message
                </button>
                {booking.teacher_phone && (
                  <>
                    <a href={`tel:${booking.teacher_phone}`} className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 transition-colors">
                      <Phone size={13} /> Appeler
                    </a>
                    <a href={`https://wa.me/${booking.teacher_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  </>
                )}
                <Link href={`/teachers/${booking.teacher}`} onClick={onClose} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  <User size={13} /> Profil
                </Link>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Matière 📝</p>
              <p className="text-sm font-bold text-gray-800">{booking.subject_name ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{fmtDate(booking.date)}</p>
            </div>
            {booking.start_time && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Horaire 🕒</p>
                <p className="text-sm font-bold text-gray-800">{booking.start_time.slice(0, 5)} – {booking.end_time?.slice(0, 5)}</p>
              </div>
            )}
            {booking.price > 0 && (
              <div className="rounded-xl bg-primary-50 p-3">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1">Montant</p>
                <p className="text-sm font-bold text-primary-700">{booking.price.toLocaleString("fr-FR")} FCFA</p>
              </div>
            )}
          </div>
        </div>

        {booking.status === "completed" && (
          <div className="border-t border-gray-100 px-5 py-4">
            <Link href={`/teachers/${booking.teacher}/review?booking=${booking.id}`} onClick={onClose} className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent-500 py-3 text-sm font-bold text-white hover:bg-accent-600 transition-colors">
              <Star size={15} /> Laisser un avis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function ProgressionWidget() {
  const [data, setData] = useState<ProgressionStats | null>(null);

  useEffect(() => {
    statsApi.progression().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const { sessions_count, hours_total, minutes_extra, subjects, next_concours } = data;

  // Barre sprint : progression vers le concours basée sur les séances
  // 20 séances = objectif complet (arbitraire, visuel)
  const GOAL = 20;
  const pct  = Math.min(100, Math.round((sessions_count / GOAL) * 100));

  const urgentColor = next_concours
    ? next_concours.days_until <= 7  ? "text-red-600"
    : next_concours.days_until <= 30 ? "text-amber-600"
    : "text-gray-500"
    : "text-gray-500";

  const barColor = next_concours
    ? next_concours.days_until <= 7  ? "bg-red-500"
    : next_concours.days_until <= 30 ? "bg-amber-500"
    : "bg-primary-500"
    : "bg-primary-500";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50">
            <TrendingUp size={15} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Ma progression</h2>
            <p className="text-[11px] text-gray-400">Séances effectuées</p>
          </div>
        </div>
        {next_concours && (
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
            next_concours.days_until <= 7  ? "border-red-200 bg-red-50 text-red-600"
            : next_concours.days_until <= 30 ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-gray-100 bg-gray-50 text-gray-500"
          }`}>
            <Target size={12} />
            {next_concours.type} dans {next_concours.days_until}j
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-50 border-b border-gray-50">
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-black text-gray-900">{sessions_count}</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">séance{sessions_count > 1 ? "s" : ""}</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-black text-gray-900">
            {hours_total < 1
              ? `${minutes_extra}min`
              : `${Math.floor(hours_total)}h${minutes_extra > 0 ? minutes_extra : ""}`}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">de cours</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-black text-gray-900">{subjects.length}</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">matière{subjects.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Sprint bar */}
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Flame size={12} className="text-orange-400" />
            Sprint vers {next_concours ? next_concours.type : "le concours"}
          </div>
          <span className="text-xs font-black text-gray-900">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
          <span>Objectif : {GOAL} séances</span>
          {pct >= 100
            ? <span className="font-bold text-primary-600">Objectif atteint 🎉</span>
            : <span>{GOAL - sessions_count} séance{GOAL - sessions_count > 1 ? "s" : ""} restante{GOAL - sessions_count > 1 ? "s" : ""}</span>
          }
        </div>

        {/* Matières chips ou CTA si aucune séance */}
        {subjects.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <span key={s} className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <Link
            href="/search"
            className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-2.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Search size={13} />
            Réserve ta première séance pour commencer le sprint
            <ChevronRight size={12} className="ml-auto" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ConcoursWidget() {
  const [events, setEvents] = useState<ConcoursEvent[]>([]);

  useEffect(() => {
    concoursApi.list().then((data) => setEvents(data.slice(0, 3))).catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-amber-500" />
          <h2 className="text-sm font-bold text-gray-800">Prochains concours</h2>
        </div>
        <Link href="/concours" className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700">
          Calendrier <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {events.map((e) => {
          const urgent = e.days_until_examen <= 7;
          const soon   = e.days_until_examen <= 30;
          return (
            <Link
              key={e.id}
              href="/concours"
              className={`flex-shrink-0 w-48 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                urgent
                  ? "border-red-200 bg-gradient-to-br from-red-50 to-amber-50"
                  : soon
                  ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black border ${
                  urgent ? "bg-red-100 text-red-700 border-red-200"
                  : soon  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {e.type}
                </span>
                <span className={`text-[11px] font-black ${
                  urgent ? "text-red-600" : soon ? "text-amber-600" : "text-gray-400"
                }`}>
                  J-{e.days_until_examen}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{e.title}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                {new Date(e.date_examen).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isLoggedIn, hasSubscription, isParent } = useAuth();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) {
      bookingsApi
        .list()
        .then((res) => setMyBookings(res.results ?? []))
        .catch(() => {})
        .finally(() => setLoadingBookings(false));
    }
    if (isLoggedIn && isParent) {
      const token = getAccessToken();
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/children/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setChildren(Array.isArray(data) ? data : (data.results ?? [])))
        .catch(() => {});
    }
  }, [isLoggedIn, isParent]);

  if (loading || !user) return <PageLoader />;

  const upcoming = myBookings.filter((b) => ["pending", "confirmed"].includes(b.status));
  const completed = myBookings.filter((b) => b.status === "completed");
  const recentCompleted = completed.slice(0, 3);
  const firstName = user.first_name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <>
    {selectedBooking && (
      <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    )}
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.avatar}
              firstName={user.first_name}
              lastName={user.last_name}
              size="lg"
            />
            <div>
              <p className="text-sm text-gray-400">{greeting} 👋</p>
              <h1 className="text-xl font-bold text-gray-900">
                {firstName} {user.last_name}
              </h1>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                <GraduationCap size={11} />
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <Bell size={14} />
            Mon profil
          </Link>
        </div>

        {/* ── Subscription banner ── */}
        {!hasSubscription && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-600 p-6 shadow-lg shadow-primary-500/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary-200" />
                  <p className="text-sm font-semibold text-primary-100">Passez à la vitesse supérieure</p>
                </div>
                <p className="mt-1 text-lg font-bold text-white">
                  Activez votre abonnement
                </p>
                <p className="mt-0.5 text-sm text-primary-100">
                  Accédez à tous les professeurs dès 1 500 FCFA/mois
                </p>
              </div>
              <Link
                href="/payment?plan=monthly"
                className="flex-shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-600 shadow-sm hover:bg-primary-50 transition-colors"
              >
                S&apos;abonner
              </Link>
            </div>
          </div>
        )}

        {hasSubscription && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-800">Abonnement actif</p>
              <p className="text-xs text-primary-600">Vous pouvez réserver tous les professeurs disponibles</p>
            </div>
            <Link href="/payment" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Gérer
            </Link>
          </div>
        )}

        {/* ── Concours widget ── */}
        <ProgressionWidget />
        <ConcoursWidget />

        {/* ── Stats ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Cours à venir"
            value={loadingBookings ? "—" : upcoming.length}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Cours terminés"
            value={loadingBookings ? "—" : completed.length}
            color="bg-primary-100 text-primary-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Total réservations"
            value={loadingBookings ? "—" : myBookings.length}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={Star}
            label="Avis donnés"
            value="—"
            sub="Bientôt disponible"
            color="bg-accent-100 text-accent-600"
          />
        </div>

        {/* ── Quick actions ── */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Search,
                label: "Trouver un prof",
                desc: "Rechercher par matière",
                href: "/search",
                gradient: "from-primary-500 to-emerald-500",
              },
              {
                icon: MessageCircle,
                label: "Messages",
                desc: "Vos conversations",
                href: "/chat",
                gradient: "from-blue-500 to-indigo-500",
              },
              ...(isParent ? [{
                icon: Users,
                label: "Mes enfants",
                desc: `${children.length} enfant${children.length > 1 ? "s" : ""}`,
                href: "/profile/children",
                gradient: "from-violet-500 to-purple-600",
              }] : [{
                icon: CreditCard,
                label: "Abonnement",
                desc: "Gérer mon plan",
                href: "/payment?plan=monthly",
                gradient: "from-accent-500 to-orange-400",
              }]),
              {
                icon: Zap,
                label: "Mon profil",
                desc: "Paramètres",
                href: "/profile",
                gradient: "from-purple-500 to-pink-500",
              },
            ].map(({ icon: Icon, label, desc, href, gradient }) => (
              <Link
                key={label}
                href={href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-bold">{label}</p>
                <p className="mt-0.5 text-xs text-white/70">{desc}</p>
                <ArrowRight
                  size={14}
                  className="absolute bottom-4 right-4 opacity-50 transition-opacity group-hover:opacity-100"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Children section (parents only) ── */}
        {isParent && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Mes enfants</h2>
                {children.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                    {children.length}
                  </span>
                )}
              </div>
              <Link href="/profile/children" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                Gérer <ChevronRight size={13} />
              </Link>
            </div>

            {children.length === 0 ? (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-5 py-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-100">
                  <Baby size={22} className="text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Ajoutez vos enfants</p>
                  <p className="text-xs text-gray-400 mt-0.5">Gérez leur agenda et leurs cours depuis ici</p>
                </div>
                <Link href="/profile/children" className="btn-primary !py-2 !px-3 text-xs flex-shrink-0">
                  <Plus size={13} className="mr-1 inline" /> Ajouter
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {children.map((child, idx) => {
                  const colors = [
                    "from-violet-500 to-purple-600",
                    "from-sky-500 to-blue-600",
                    "from-rose-500 to-pink-600",
                    "from-amber-500 to-orange-500",
                    "from-emerald-500 to-teal-600",
                  ];
                  const gradient = colors[idx % colors.length];
                  return (
                    <Link
                      key={child.id}
                      href={`/profile/children/${child.id}`}
                      className={`flex-shrink-0 w-32 rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-base font-bold mb-3">
                        {child.first_name[0]}{child.last_name[0]}
                      </div>
                      <p className="text-sm font-bold truncate">{child.first_name}</p>
                      <p className="text-xs text-white/70 truncate">{child.level?.name ?? "Niveau —"}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-white/60 font-semibold">
                        <CalendarDays size={9} /> Agenda
                      </div>
                    </Link>
                  );
                })}
                <Link
                  href="/profile/children"
                  className="flex-shrink-0 w-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 py-4 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors bg-white"
                >
                  <Plus size={20} />
                  <span className="text-xs font-semibold">Ajouter</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Upcoming sessions ── */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Cours à venir</h2>
              {upcoming.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                  {upcoming.length}
                </span>
              )}
            </div>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Réserver <ArrowRight size={13} />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <BookOpen size={26} className="text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Aucun cours prévu</p>
                <p className="mt-1 text-sm text-gray-400">
                  Trouvez un professeur et réservez votre premier cours
                </p>
              </div>
              <Link href="/search" className="btn-primary">
                Trouver un professeur
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((booking) => {
                const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full text-left flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <span className="text-xs font-medium uppercase leading-none">
                        {booking.date ? new Date(booking.date).toLocaleDateString("fr-FR", { month: "short" }) : "—"}
                      </span>
                      <span className="text-xl font-bold leading-none">
                        {booking.date ? new Date(booking.date).getDate() : "—"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{booking.subject_name ?? "Cours"}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{booking.teacher_name ?? "Professeur"}</p>
                      {booking.start_time && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} />
                          {booking.start_time.slice(0, 5)}{booking.end_time ? ` – ${booking.end_time.slice(0, 5)}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                      </span>
                      <span className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
                        Contacter <ChevronRight size={11} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent completed ── */}
        {recentCompleted.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Historique récent</h2>
              <span className="text-sm text-gray-400">{completed.length} cours terminés</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {recentCompleted.map((booking, idx) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <CheckCircle2 size={16} className="text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {booking.subject_name ?? "Cours"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {booking.teacher_name ?? "Professeur"} · {booking.date}
                    </p>
                  </div>
                  <Link
                    href={`/teachers/${booking.teacher}/review?booking=${booking.id}`}
                    className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-100 transition-colors"
                  >
                    <Star size={11} />
                    Avis
                  </Link>
                </div>
              ))}
              {completed.length > 3 && (
                <div className="flex items-center justify-center px-5 py-3">
                  <button className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-600">
                    Voir tout l&apos;historique <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
