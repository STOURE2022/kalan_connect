"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, RefreshCcw, Home, Loader2 } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}

function CancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get("plan");
  const retryHref = plan ? `/payment?plan=${plan}` : "/payment";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Hero icon */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
            <XCircle size={48} className="text-orange-500" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Paiement annulé
          </h1>
          <p className="mt-2 text-gray-500">
            Votre paiement n&apos;a pas abouti. Aucun montant n&apos;a été débité.
          </p>
        </div>

        {/* Info card */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500">
              Si vous avez rencontré un problème, vous pouvez réessayer le
              paiement ou contacter notre support. Aucune transaction n&apos;a
              été effectuée sur votre compte Orange Money.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push(retryHref)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98]"
          >
            <RefreshCcw size={16} />
            Réessayer
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    </div>
  );
}
