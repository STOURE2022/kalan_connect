"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, CreditCard, Star, Settings, Bell, HelpCircle,
  LogOut, ChevronRight, CheckCircle2, MapPin, Phone, Shield,
  GraduationCap, BookOpen, Clock, TrendingUp, Edit3, AlertTriangle,
  Wifi, Home, Users, Award, Baby, LayoutDashboard, Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { bookings as bookingsApi } from "@/lib/api";
import { getAccessToken } from "@/lib/api";
import type { Booking } from "@/types";
import { useRef } from "react";

// ── Avatar avec bouton upload ────────────────────────────────────────────
function AvatarUpload({
  user,
  onUploaded,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getAccessToken();
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) onUploaded();
    } catch {
      // silently ignore
    }
    e.target.value = "";
  };

  return (
    <div className="relative mx-auto mb-4 inline-block">
      <Avatar
        src={user.avatar}
        firstName={user.first_name}
        lastName={user.last_name}
        size="xl"
        className="ring-4 ring-white/40"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-800/80 shadow transition-colors hover:bg-gray-900"
        title="Changer la photo"
      >
        <Camera size={14} className="text-white" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent", student: "Élève", etudiant: "Étudiant",
  teacher: "Professeur", admin: "Admin",
};

const ACCOUNT_MENU = [
  { icon: Bell,       label: "Notifications",  href: "/profile/notifications", color: "bg-primary-100 text-primary-600" },
  { icon: Settings,   label: "Paramètres",     href: "/profile/settings",      color: "bg-gray-100 text-gray-600"       },
  { icon: HelpCircle, label: "Aide & Support", href: "/profile/help",          color: "bg-orange-100 text-orange-600"   },
];

const PARENT_MENU_GROUPS = [
  {
    title: "Mes enfants",
    items: [
      { icon: Baby,         label: "Gérer mes enfants",       href: "/profile/children",  color: "bg-violet-100 text-violet-600" },
    ],
  },
  {
    title: "Mon activité",
    items: [
      { icon: CalendarDays, label: "Mes réservations",        href: "/profile/bookings",  color: "bg-blue-100 text-blue-600"     },
      { icon: CreditCard,   label: "Abonnement & paiements",  href: "/profile/payments",  color: "bg-purple-100 text-purple-600" },
      { icon: Star,         label: "Mes avis",                href: "/profile/reviews",   color: "bg-accent-100 text-accent-600" },
    ],
  },
  { title: "Compte", items: ACCOUNT_MENU },
];

const STUDENT_MENU_GROUPS = [
  {
    title: "Mon activité",
    items: [
      { icon: CalendarDays, label: "Mes réservations",        href: "/profile/bookings",  color: "bg-blue-100 text-blue-600"     },
      { icon: CreditCard,   label: "Abonnement & paiements",  href: "/profile/payments",  color: "bg-purple-100 text-purple-600" },
      { icon: Star,         label: "Mes avis",                href: "/profile/reviews",   color: "bg-accent-100 text-accent-600" },
    ],
  },
  { title: "Compte", items: ACCOUNT_MENU },
];

const TEACHER_MENU_GROUPS = [
  {
    title: "Mon activité",
    items: [
      { icon: CalendarDays, label: "Mes réservations",       href: "/profile/bookings",       color: "bg-blue-100 text-blue-600"      },
      { icon: Users,        label: "Mes sessions de groupe",  href: "/profile/teacher/events", color: "bg-emerald-100 text-emerald-600" },
      { icon: Clock,        label: "Mes disponibilités",      href: "/profile/teacher/schedule", color: "bg-teal-100 text-teal-600"    },
      { icon: TrendingUp,   label: "Mes statistiques",        href: "/profile/stats",          color: "bg-purple-100 text-purple-600"  },
    ],
  },
  {
    title: "Mon profil enseignant",
    items: [
      { icon: Edit3,  label: "Modifier mon profil", href: "/profile/teacher/edit",     color: "bg-primary-100 text-primary-600" },
      { icon: Award,  label: "Mes diplômes",        href: "/profile/teacher/diplomas", color: "bg-indigo-100 text-indigo-600"   },
      { icon: Star,   label: "Mes avis reçus",      href: "/profile/reviews",          color: "bg-accent-100 text-accent-600"   },
    ],
  },
  {
    title: "Compte",
    items: [
      { icon: Bell,       label: "Notifications",  href: "/profile/notifications", color: "bg-rose-100 text-rose-600"     },
      { icon: Settings,   label: "Paramètres",     href: "/profile/settings",      color: "bg-gray-100 text-gray-600"     },
      { icon: HelpCircle, label: "Aide & Support", href: "/profile/help",          color: "bg-orange-100 text-orange-600" },
    ],
  },
];

// ── Vue Professeur ──────────────────────────────────────────────────────
function TeacherProfileView({ user, logout, refreshUser }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; logout: () => void; refreshUser: () => Promise<void> }) {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [teacherData, setTeacherData] = useState<{
    is_verified: boolean; avg_rating: number; total_bookings: number;
    total_reviews: number; hourly_rate: number; subjects: string[];
    teaches_online: boolean; teaches_at_home: boolean;
  } | null>(null);

  useEffect(() => {
    // Fetch teacher profile via /api/v1/teachers/me/
    const token = getAccessToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTeacherData)
      .catch(() => {});

    // Fetch pending bookings
    bookingsApi.list()
      .then((res) => {
        const pending = (res.results ?? []).filter((b) => b.status === "pending");
        setPendingBookings(pending);
      })
      .catch(() => {});
  }, []);

  const hasProfile = !!teacherData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-primary-500 px-4 pb-28 pt-10">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-lg text-center">
          <div className="relative mx-auto mb-4 inline-block">
            <AvatarUpload user={user} onUploaded={refreshUser} />
            {teacherData?.is_verified && (
              <div className="absolute -bottom-5 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-400 shadow">
                <Shield size={13} className="text-white" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">{user.first_name} {user.last_name}</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <GraduationCap size={11} /> Professeur
            </span>
            {teacherData === null ? (
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                <AlertTriangle size={11} /> Profil à compléter
              </span>
            ) : teacherData.is_verified ? (
              <span className="flex items-center gap-1 rounded-full bg-primary-400/40 px-3 py-1 text-xs font-semibold text-white">
                <CheckCircle2 size={11} /> Vérifié
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-400/40 px-3 py-1 text-xs font-semibold text-white">
                <Clock size={11} /> En attente de vérification
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-indigo-100">
            {user.phone && <span className="flex items-center gap-1"><Phone size={11} />{user.phone}</span>}
            {user.city && <span className="flex items-center gap-1"><MapPin size={11} />{user.city}</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">

        {/* Profile incomplete banner */}
        {!hasProfile && (
          <div className="relative z-10 -mt-8 mb-5">
            <Link
              href="/profile/teacher/edit"
              className="group relative block overflow-hidden rounded-2xl shadow-xl shadow-amber-500/30"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ef4444 100%)" }}
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[200%]" style={{ width: "50%" }} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <div className="relative flex items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Profil incomplet</p>
                  <p className="text-xs text-orange-100">Complétez votre profil pour apparaître dans les recherches</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-orange-500 shadow-md transition-transform group-hover:scale-105">
                  Compléter →
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Stats cards — only if profile exists */}
        {hasProfile && (
          <div className="relative z-10 -mt-8 mb-5 grid grid-cols-4 gap-2">
            {[
              { label: "Note",       value: teacherData!.avg_rating ? `${teacherData!.avg_rating.toFixed(1)}★` : "—",  color: "text-accent-500"  },
              { label: "Avis",       value: teacherData!.total_reviews ?? "—",  color: "text-purple-500" },
              { label: "Cours",      value: teacherData!.total_bookings ?? "—", color: "text-blue-500"   },
              { label: "FCFA/h",     value: teacherData!.hourly_rate ? `${(teacherData!.hourly_rate / 1000).toFixed(0)}K` : "—", color: "text-primary-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-lg">
                <p className={`text-lg font-extrabold ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Modes enseignement */}
        {hasProfile && (
          <div className="mb-5 flex gap-2">
            {teacherData!.teaches_online && (
              <span className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                <Wifi size={12} /> En ligne
              </span>
            )}
            {teacherData!.teaches_at_home && (
              <span className="flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600">
                <Home size={12} /> À domicile
              </span>
            )}
            {teacherData!.teaches_at_home === false && !teacherData!.teaches_online && (
              <span className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
                <Users size={12} /> Présentiel
              </span>
            )}
          </div>
        )}

        {/* Pending bookings alert */}
        {pendingBookings.length > 0 && (
          <Link
            href="/profile/bookings"
            className="mb-5 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                {pendingBookings.length} réservation{pendingBookings.length > 1 ? "s" : ""} en attente
              </p>
              <p className="text-xs text-amber-600">Confirmez ou refusez dès maintenant</p>
            </div>
            <ChevronRight size={16} className="text-amber-400" />
          </Link>
        )}

        {/* Verification banner */}
        {hasProfile && !teacherData!.is_verified && (
          <div className="mb-5 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <Shield size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Vérification en cours</p>
              <p className="text-xs text-blue-600">L'équipe KalanConnect vérifie votre profil sous 48h</p>
            </div>
          </div>
        )}

        {/* Accès rapide tableau de bord */}
        <Link
          href="/dashboard/teacher"
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          <LayoutDashboard size={16} /> Accéder au tableau de bord
        </Link>

        {/* Menu */}
        {TEACHER_MENU_GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.title}</p>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {group.items.map(({ icon: Icon, label, href, color }) => (
                <Link key={href} href={href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={17} /></div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={logout}
          className="mb-10 mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ── Vue Parent / Élève / Étudiant ───────────────────────────────────────
function ParentProfileView({ user, logout, hasSubscription, isParent, isAdmin, refreshUser }: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  logout: () => void;
  hasSubscription: boolean;
  isParent: boolean;
  isAdmin?: boolean;
  refreshUser: () => Promise<void>;
}) {
  const dashboardHref = isAdmin ? "/dashboard/admin" : "/dashboard";
  const menuGroups = isParent ? PARENT_MENU_GROUPS : STUDENT_MENU_GROUPS;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 px-4 pb-28 pt-10">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-lg text-center">
          <div className="relative mx-auto mb-4 inline-block">
            <AvatarUpload user={user} onUploaded={refreshUser} />
            {hasSubscription && (
              <div className="absolute -bottom-5 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-400 shadow">
                <Shield size={13} className="text-white" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">{user.first_name} {user.last_name}</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <GraduationCap size={11} /> {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-primary-100">
            {user.phone && <span className="flex items-center gap-1"><Phone size={11} />{user.phone}</span>}
            {user.city && <span className="flex items-center gap-1"><MapPin size={11} />{user.neighborhood ? `${user.neighborhood}, ` : ""}{user.city}</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Subscription card */}
        <div className="relative z-10 -mt-8 mb-5">
          {hasSubscription ? (
            <div className="flex items-center gap-4 rounded-2xl border border-primary-100 bg-white px-5 py-4 shadow-lg shadow-primary-500/10">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Abonnement actif</p>
                <p className="text-xs text-gray-400">Accès illimité à tous les professeurs</p>
              </div>
              <Link href="/profile/payments" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Gérer →</Link>
            </div>
          ) : (
            <Link
              href="/payment?plan=monthly"
              className="group relative block overflow-hidden rounded-2xl shadow-xl shadow-amber-500/30"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 40%, #ef4444 100%)" }}
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[200%]" style={{ width: "50%" }} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <div className="relative flex items-center gap-4 px-5 py-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <CreditCard size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">✨ Offre spéciale</span>
                  </div>
                  <p className="mt-1 text-base font-extrabold text-white">Activez votre accès</p>
                  <p className="text-xs font-medium text-orange-100">Accédez à +500 profs · Dès <span className="font-bold text-white">1 500 FCFA</span>/mois</p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-center gap-1">
                  <div className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-orange-500 shadow-md transition-transform group-hover:scale-105">S&apos;abonner</div>
                  <span className="text-[10px] text-orange-100">Sans engagement</span>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Quick stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Réservations", icon: CalendarDays, color: "text-blue-500"    },
            { label: "Avis donnés",  icon: Star,          color: "text-accent-500"  },
            { label: "Messages",     icon: Bell,          color: "text-primary-500" },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <Icon size={20} className={`mx-auto mb-1.5 ${color}`} />
              <p className="text-lg font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.title}</p>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {group.items.map(({ icon: Icon, label, href, color }) => (
                <Link key={href} href={href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={17} /></div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <Link
          href={dashboardHref}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 py-3.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-100"
        >
          <LayoutDashboard size={16} /> Accéder au tableau de bord
        </Link>

        <button
          onClick={logout}
          className="mb-10 mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isLoggedIn, logout, hasSubscription, isTeacher, isParent, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  if (loading || !user) return <PageLoader />;

  if (isTeacher) {
    return <TeacherProfileView user={user} logout={logout} refreshUser={refreshUser} />;
  }

  return <ParentProfileView user={user} logout={logout} hasSubscription={hasSubscription} isParent={isParent} isAdmin={user.role === "admin"} refreshUser={refreshUser} />;
}
