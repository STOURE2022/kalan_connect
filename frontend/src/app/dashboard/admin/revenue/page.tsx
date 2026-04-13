"use client";

import { getAccessToken } from "@/lib/api";


import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface RevenueData {
  total_revenue: number;
  monthly_revenue: { month: string; amount: number }[];
}

const GRADIENT_COLORS = [
  "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#3b82f6", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#a855f7",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1e2130] border border-white/10 px-3 py-2.5 shadow-xl text-xs">
      <p className="text-white/40 mb-1.5 font-semibold">{label}</p>
      <p className="text-primary-400 font-black text-sm">{(payload[0]?.value ?? 0).toLocaleString()} FCFA</p>
    </div>
  );
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const token = () => getAccessToken();
  const api = (p: string) => `${process.env.NEXT_PUBLIC_API_URL}${p}`;

  useEffect(() => {
    fetch(api("/admin/revenue/"), { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthly = data?.monthly_revenue ?? [];
  const totalRevenue = data?.total_revenue ?? 0;

  // Compute MoM growth
  const last = monthly[monthly.length - 1]?.amount ?? 0;
  const prev = monthly[monthly.length - 2]?.amount ?? 0;
  const growth = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  const avgMonthly = monthly.length > 0 ? monthly.reduce((a, b) => a + b.amount, 0) / monthly.length : 0;
  const bestMonth = monthly.reduce((a, b) => (b.amount > a.amount ? b : a), { month: "—", amount: 0 });

  const barData = monthly.slice(-12);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">Revenus</h1>
        <p className="text-xs text-white/30 mt-0.5">Analyse financière de la plateforme</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Revenu total",
            value: `${totalRevenue.toLocaleString()} FCFA`,
            sub: "Depuis le lancement",
            gradient: "from-primary-500 to-emerald-600",
            icon: TrendingUp,
          },
          {
            label: "Ce mois",
            value: `${last.toLocaleString()} FCFA`,
            sub: growth >= 0 ? `+${growth.toFixed(1)}% vs mois dernier` : `${growth.toFixed(1)}% vs mois dernier`,
            gradient: growth >= 0 ? "from-blue-600 to-indigo-700" : "from-red-600 to-rose-700",
            icon: growth >= 0 ? TrendingUp : TrendingDown,
          },
          {
            label: "Moyenne mensuelle",
            value: `${Math.round(avgMonthly).toLocaleString()} FCFA`,
            sub: `Sur ${monthly.length} mois`,
            gradient: "from-violet-600 to-purple-700",
            icon: CreditCard,
          },
          {
            label: "Meilleur mois",
            value: bestMonth.month,
            sub: `${bestMonth.amount.toLocaleString()} FCFA`,
            gradient: "from-amber-500 to-orange-600",
            icon: ArrowUpRight,
          },
        ].map(({ label, value, sub, gradient, icon: Icon }) => (
          <div key={label} className={`rounded-2xl bg-gradient-to-br ${gradient} p-5`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 mb-4">
              <Icon size={16} className="text-white" />
            </div>
            <p className="text-xl font-black text-white leading-tight">{value}</p>
            <p className="text-xs font-semibold text-white/70 mt-0.5">{label}</p>
            <p className="text-[10px] text-white/40 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="rounded-2xl bg-[#13151f] border border-white/5 p-5">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white">Évolution des revenus</h2>
          <p className="text-xs text-white/30 mt-0.5">Tous les mois disponibles</p>
        </div>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-48 items-center justify-center text-xs text-white/20">Aucune donnée disponible</div>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl bg-[#13151f] border border-white/5 p-5">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white">Comparaison mensuelle</h2>
          <p className="text-xs text-white/30 mt-0.5">12 derniers mois</p>
        </div>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-40 items-center justify-center text-xs text-white/20">Aucune donnée</div>
        )}
      </div>

      {/* Monthly table */}
      {monthly.length > 0 && (
        <div className="rounded-2xl bg-[#13151f] border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Détail par mois</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Mois</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-white/30 uppercase tracking-wider">Revenu</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">vs mois préc.</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">% du total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...monthly].reverse().map((m, i, arr) => {
                  const prevAmount = arr[i + 1]?.amount ?? 0;
                  const diff = m.amount - prevAmount;
                  const diffPct = prevAmount > 0 ? ((diff / prevAmount) * 100).toFixed(1) : null;
                  const sharePct = totalRevenue > 0 ? ((m.amount / totalRevenue) * 100).toFixed(1) : "0";
                  return (
                    <tr key={m.month} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">{m.month}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-black text-white">
                        {m.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        {diffPct !== null ? (
                          <span className={`text-xs font-bold ${diff >= 0 ? "text-primary-400" : "text-red-400"}`}>
                            {diff >= 0 ? "+" : ""}{diffPct}%
                          </span>
                        ) : <span className="text-xs text-white/20">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary-500"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/40 w-8 text-right">{sharePct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
