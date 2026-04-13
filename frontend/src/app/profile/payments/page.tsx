"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { payments as paymentsApi } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { Subscription } from "@/types";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  active:    { label: "Actif",    color: "text-primary-700", bg: "bg-primary-50", icon: CheckCircle2 },
  expired:   { label: "Expiré",   color: "text-gray-500",    bg: "bg-gray-100",   icon: Clock        },
  cancelled: { label: "Annulé",   color: "text-red-600",     bg: "bg-red-50",     icon: XCircle      },
  pending:   { label: "En cours", color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock        },
};

export default function PaymentsPage() {
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) {
      paymentsApi.getSubscriptions()
        .then((res) => setSubscriptions(res.results ?? []))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [isLoggedIn]);

  if (loading) return <PageLoader />;

  const active = subscriptions.find((s) => s.status === "active");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Abonnement & paiements</h1>
      </div>

      {/* Active subscription card */}
      {active ? (
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 p-6 text-white shadow-lg shadow-primary-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Abonnement actif</p>
              <p className="mt-1 text-2xl font-bold">{PLAN_LABELS[active.plan] ?? active.plan}</p>
              <p className="mt-1 text-sm text-primary-100">
                {active.price.toLocaleString()} FCFA / {active.plan === "monthly" ? "mois" : "an"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <CreditCard size={22} className="text-white" />
            </div>
          </div>
          {active.end_date && (
            <div className="mt-4 rounded-xl bg-white/10 px-4 py-2.5">
              <p className="text-xs text-primary-100">Expire le</p>
              <p className="font-semibold">{new Date(active.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-dashed border-gray-200 bg-white p-5">
          <div>
            <p className="font-semibold text-gray-700">Aucun abonnement actif</p>
            <p className="mt-0.5 text-sm text-gray-400">Abonnez-vous pour réserver des cours</p>
          </div>
          <Link
            href="/payment?plan=monthly"
            className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600 transition-colors"
          >
            S&apos;abonner <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Plans */}
      {!active && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            { plan: "monthly", price: "1 500 FCFA", period: "par mois", desc: "Sans engagement" },
            { plan: "annual",  price: "15 000 FCFA", period: "par an", desc: "2 mois offerts (-17%)" },
          ].map(({ plan, price, period, desc }) => (
            <Link
              key={plan}
              href={`/payment?plan=${plan}`}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary-200 hover:shadow-md transition-all"
            >
              <p className="text-sm font-semibold text-gray-700">{PLAN_LABELS[plan]}</p>
              <p className="mt-2 text-xl font-bold text-gray-900">{price}</p>
              <p className="text-xs text-gray-400">{period}</p>
              <p className="mt-1 text-xs font-medium text-primary-600">{desc}</p>
            </Link>
          ))}
        </div>
      )}

      {/* History */}
      {fetching ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-400">
          <p className="text-sm">Aucun historique de paiement</p>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-500">Historique</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
            {subscriptions.map((sub) => {
              const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.expired;
              const Icon = cfg.icon;
              return (
                <div key={sub.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <CreditCard size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {PLAN_LABELS[sub.plan] ?? sub.plan} — {sub.price.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-400">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString("fr-FR") : "—"}
                      {sub.end_date ? ` → ${new Date(sub.end_date).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
