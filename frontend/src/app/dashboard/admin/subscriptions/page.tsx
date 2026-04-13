"use client";

import { useEffect, useState } from "react";
import { CreditCard, RefreshCw, Search, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react";
import { getAccessToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface SubscriptionUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Subscription {
  id: number;
  plan: "monthly" | "annual";
  status: "active" | "expired" | "cancelled" | "pending";
  price: number;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
  user: SubscriptionUser;
}

const STATUS_TABS = [
  { key: "",           label: "Tous"     },
  { key: "active",    label: "Actifs"   },
  { key: "expired",   label: "Expirés"  },
  { key: "cancelled", label: "Annulés"  },
  { key: "pending",   label: "En attente" },
];

const PLAN_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  annual:  "Annuel",
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  expired:   "bg-white/5 text-white/40 border-white/10",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const STATUS_FR: Record<string, string> = {
  active:    "Actif",
  expired:   "Expiré",
  cancelled: "Annulé",
  pending:   "En attente",
};

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]       = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    const token = getAccessToken();
    const params = tab ? `?status=${tab}` : "";
    fetch(`${API}/admin/subscriptions/${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setSubs(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = subs.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.user.first_name.toLowerCase().includes(q) ||
      s.user.last_name.toLowerCase().includes(q) ||
      s.user.phone.includes(q)
    );
  });

  const active  = subs.filter((s) => s.status === "active").length;
  const monthly = subs.filter((s) => s.status === "active" && s.plan === "monthly").length;
  const annual  = subs.filter((s) => s.status === "active" && s.plan === "annual").length;
  const revenue = subs
    .filter((s) => s.status === "active")
    .reduce((acc, s) => acc + s.price, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Abonnements</h1>
        <p className="text-sm text-white/40 mt-0.5">Gestion de tous les abonnements parents</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Abonnés actifs",   value: active,   icon: Users,      color: "from-emerald-500 to-teal-500" },
          { label: "Formule mensuelle", value: monthly,  icon: CreditCard, color: "from-blue-500 to-indigo-500" },
          { label: "Formule annuelle",  value: annual,   icon: TrendingUp, color: "from-violet-500 to-purple-500" },
          { label: "Revenu abonnements (FCFA)", value: revenue.toLocaleString("fr-FR"), icon: CreditCard, color: "from-amber-500 to-orange-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-[#13151f] border border-white/5 p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-xl bg-white/5 p-1 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === key ? "bg-primary-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher un abonné..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#13151f] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={20} className="text-white/30 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <CreditCard size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun abonnement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Abonné", "Formule", "Statut", "Prix", "Début", "Fin", "Renouvellement"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{sub.user.first_name} {sub.user.last_name}</p>
                        <p className="text-xs text-white/40">{sub.user.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border ${
                        sub.plan === "annual"
                          ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
                          : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                      }`}>
                        {PLAN_LABEL[sub.plan]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${STATUS_STYLES[sub.status]}`}>
                        {STATUS_FR[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {sub.price.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">{fmt(sub.start_date)}</td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">{fmt(sub.end_date)}</td>
                    <td className="px-4 py-3">
                      {sub.auto_renew ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle size={12} /> Auto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-white/30">
                          <XCircle size={12} /> Manuel
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
