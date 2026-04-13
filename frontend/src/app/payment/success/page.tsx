"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PLAN_LABELS: Record<string, { name: string; duration: string }> = {
  monthly: { name: "Mensuel", duration: "1 mois" },
  annual:  { name: "Annuel",  duration: "12 mois" },
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();

  const planKey = searchParams.get("plan") ?? "monthly";
  const plan = PLAN_LABELS[planKey] ?? PLAN_LABELS.monthly;

  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshUser();
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  // refreshUser is stable (useCallback), safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (syncing) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-primary-500" />
          <p className="mt-4 text-sm text-gray-500">Mise à jour de votre abonnement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Hero icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100">
              <CheckCircle2 size={48} className="text-primary-500" />
            </div>
            <Sparkles
              size={20}
              className="absolute -right-1 -top-1 text-yellow-400"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Paiement réussi&nbsp;!
          </h1>
          <p className="mt-2 text-gray-500">
            Votre abonnement est maintenant actif.
          </p>
        </div>

        {/* Details card */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CreditCard size={16} className="text-primary-500" />
              Détails de l&apos;abonnement
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-semibold text-gray-900">
                  {plan.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Durée</span>
                <span className="text-sm font-semibold text-gray-900">
                  {plan.duration}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Statut</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/search")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98]"
          >
            Trouver un professeur
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => router.push("/profile/payments")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
          >
            <CreditCard size={16} />
            Mon abonnement
          </button>
        </div>
      </div>
    </div>
  );
}
