"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, BookOpen, TrendingUp, Flag,
  Clock, CheckCircle2, XCircle, AlertTriangle,
  ArrowUpRight, ArrowRight, Activity, CreditCard,
  UserCheck, Zap, Star, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  total_users: number;
  total_teachers: number;
  total_parents: number;
  total_students: number;
  total_bookings: number;
  total_revenue: number;
  pending_verifications: number;
  pending_reports: number;
  active_subscriptions: number;
  new_users_this_month: number;
  bookings_this_month: number;
}

interface RevenueData {
  total_revenue: number;
  monthly_revenue: { month: string; amount: number }[];
}

const BOOKING_STATUSES = [
  { key: "pending",   label: "En attente", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmés",  color: "#3b82f6" },
  { key: "completed", label: "Terminés",   color: "#10b981" },
  { key: "cancelled", label: "Annulés",    color: "#ef4444" },
];

function KpiCard({
  icon: Icon, label, value, sub, gradient, href, alert,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; gradient: string; href?: string; alert?: boolean;
}) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Icon size={18} className="text-white" />
        </div>
        {alert && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            !
          </span>
        )}
        {href && !alert && <ArrowUpRight size={14} className="text-white/40" />}
      </div>
      <p className="mt-4 text-3xl font-black text-white tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-white/70">{label}</p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1e2130] border border-white/10 px-3 py-2 shadow-xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {typeof p.value === "number" && p.name === "amount"
            ? `${p.value.toLocaleString()} FCFA`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [bookingsByStatus, setBookingsByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const token = () => getAccessToken();
  const api = (p: string) => `${process.env.NEXT_PUBLIC_API_URL}${p}`;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, revRes, bkRes] = await Promise.all([
          fetch(api("/admin/dashboard/"), { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(api("/admin/revenue/"),   { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(api("/admin/bookings/"),  { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (revRes.ok)   setRevenue(await revRes.json());
        if (bkRes.ok) {
          const bkData = await bkRes.json();
          const bookings: any[] = Array.isArray(bkData) ? bkData : (bkData.results ?? []);
          const counts: Record<string, number> = {};
          BOOKING_STATUSES.forEach((s) => { counts[s.key] = 0; });
          bookings.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++; });
          setBookingsByStatus(counts);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const revenueChartData = revenue?.monthly_revenue?.slice(-6).map((m) => ({
    month: m.month,
    amount: m.amount,
  })) ?? [];

  const bookingChartData = BOOKING_STATUSES.map((s) => ({
    name: s.label,
    value: bookingsByStatus[s.key] ?? 0,
    fill: s.color,
  }));

  const totalBookingsChart = bookingChartData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">{greeting}, {user?.first_name} 👋</p>
          <h1 className="text-xl font-black text-white mt-0.5">Vue d&apos;ensemble</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/50">
          <Activity size={12} className="text-primary-400" />
          Mis à jour à l&apos;instant
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={Users}       label="Utilisateurs"         value={stats?.total_users ?? 0}          sub={`+${stats?.new_users_this_month ?? 0} ce mois`}  gradient="bg-gradient-to-br from-blue-600 to-indigo-700"     href="/dashboard/admin/users" />
          <KpiCard icon={GraduationCap} label="Professeurs"        value={stats?.total_teachers ?? 0}       sub={`${stats?.pending_verifications ?? 0} en attente`} gradient="bg-gradient-to-br from-violet-600 to-purple-700"   href="/dashboard/admin/teachers" alert={(stats?.pending_verifications ?? 0) > 0} />
          <KpiCard icon={BookOpen}    label="Réservations"         value={stats?.total_bookings ?? 0}       sub={`${stats?.bookings_this_month ?? 0} ce mois`}     gradient="bg-gradient-to-br from-teal-600 to-emerald-700"    href="/dashboard/admin/bookings" />
          <KpiCard icon={TrendingUp}  label="Revenus totaux"       value={`${(stats?.total_revenue ?? 0).toLocaleString()} F`} gradient="bg-gradient-to-br from-primary-500 to-emerald-600" href="/dashboard/admin/revenue" />
          <KpiCard icon={CreditCard}  label="Abonnements actifs"   value={stats?.active_subscriptions ?? 0} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
          <KpiCard icon={UserCheck}   label="Parents inscrits"     value={stats?.total_parents ?? 0}        gradient="bg-gradient-to-br from-pink-600 to-rose-700" />
          <KpiCard icon={Zap}         label="Élèves / Étudiants"   value={stats?.total_students ?? 0}       gradient="bg-gradient-to-br from-cyan-600 to-sky-700" />
          <KpiCard icon={Flag}        label="Signalements actifs"  value={stats?.pending_reports ?? 0}      gradient="bg-gradient-to-br from-red-600 to-rose-800"    href="/dashboard/admin/reports" alert={(stats?.pending_reports ?? 0) > 0} />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#13151f] border border-white/5 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Revenus mensuels</h2>
              <p className="text-xs text-white/30 mt-0.5">6 derniers mois · FCFA</p>
            </div>
            <Link href="/dashboard/admin/revenue" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-semibold">
              Détails <ArrowRight size={11} />
            </Link>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-white/20">Aucune donnée disponible</div>
          )}
        </div>

        {/* Bookings by status */}
        <div className="rounded-2xl bg-[#13151f] border border-white/5 p-5">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-white">Réservations par statut</h2>
            <p className="text-xs text-white/30 mt-0.5">{totalBookingsChart} au total</p>
          </div>
          {totalBookingsChart > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={bookingChartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {bookingChartData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {BOOKING_STATUSES.map((s) => {
                  const count = bookingsByStatus[s.key] ?? 0;
                  const pct = totalBookingsChart > 0 ? Math.round((count / totalBookingsChart) * 100) : 0;
                  return (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="flex-1 text-xs text-white/50">{s.label}</span>
                      <span className="text-xs font-bold text-white">{count}</span>
                      <span className="text-xs text-white/30 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-white/20">Aucune réservation</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/dashboard/admin/teachers",      icon: GraduationCap, label: "Vérifier des professeurs",   desc: `${stats?.pending_verifications ?? 0} en attente`,              color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40" },
          { href: "/dashboard/admin/reports",        icon: Flag,           label: "Traiter les signalements",   desc: `${stats?.pending_reports ?? 0} signalement(s)`,                color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20 hover:border-red-500/40" },
          { href: "/dashboard/admin/users",          icon: Users,          label: "Gérer les utilisateurs",     desc: `${stats?.total_users ?? 0} comptes`,                           color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40" },
          { href: "/dashboard/admin/subscriptions",  icon: CreditCard,     label: "Abonnements actifs",         desc: `${stats?.active_subscriptions ?? 0} abonnés`,                  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40" },
          { href: "/dashboard/admin/reviews",        icon: Star,           label: "Modérer les avis",           desc: "Avis et évaluations",                                          color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40" },
          { href: "/dashboard/admin/revenue",        icon: TrendingUp,     label: "Analyser les revenus",       desc: `${(stats?.total_revenue ?? 0).toLocaleString()} FCFA`,         color: "text-primary-400", bg: "bg-primary-500/10 border-primary-500/20 hover:border-primary-500/40" },
        ].map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${bg}`}>
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${color}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{label}</p>
              <p className={`text-xs ${color} font-semibold`}>{desc}</p>
            </div>
            <ArrowRight size={13} className="ml-auto text-white/20 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Django Admin */}
      <a
        href={`${(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/v1\/?$/, "")}/admin/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-500/40 transition-all"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
          <ExternalLink size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white">Django Admin</p>
          <p className="text-xs text-amber-400 font-semibold">Accès aux chats, logs et gestion avancée</p>
        </div>
        <ExternalLink size={13} className="ml-auto text-amber-400/40 flex-shrink-0" />
      </a>
    </div>
  );
}
