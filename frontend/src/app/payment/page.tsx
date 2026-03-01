"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Phone,
  Shield,
  Loader2,
  CircleDollarSign,
} from "lucide-react";
import { payments as paymentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, cn } from "@/lib/utils";
import toast from "react-hot-toast";

type PaymentStep = "plan" | "processing" | "success" | "error";

const plans = [
  {
    id: "monthly" as const,
    name: "Mensuel",
    price: 1500,
    perMonth: 1500,
    description: "Sans engagement",
    features: [
      "Acces a tous les profils",
      "Messagerie illimitee",
      "Reservation de cours",
    ],
  },
  {
    id: "annual" as const,
    name: "Annuel",
    price: 15000,
    perMonth: 1250,
    description: "2 mois offerts",
    badge: "Meilleure offre",
    features: [
      "Acces a tous les profils",
      "Messagerie illimitee",
      "Reservation de cours",
      "2 mois gratuits",
    ],
  },
];

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    (searchParams.get("plan") as "monthly" | "annual") || "annual"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<PaymentStep>("plan");
  const [loading, setLoading] = useState(false);

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;

  const handlePayment = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    if (!phoneNumber) {
      toast.error("Entrez votre numero Orange Money");
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const result = await paymentsApi.initiate(selectedPlan, phoneNumber);

      // If Orange Money returns a payment URL, redirect
      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else {
        // Wait for webhook / USSD confirmation
        // In production: poll for status or use WebSocket
        setTimeout(() => {
          setStep("success");
        }, 5000);
      }
    } catch {
      setStep("error");
      toast.error("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  // ── Processing step ──
  if (step === "processing") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <Loader2 size={48} className="mx-auto animate-spin text-accent-500" />
          <h2 className="mt-6 text-xl font-bold text-gray-900">
            En attente de confirmation
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Confirmez le paiement de{" "}
            <strong>{formatPrice(currentPlan.price)}</strong> sur votre
            telephone Orange Money.
          </p>
          <div className="mt-4 rounded-xl bg-accent-50 p-4 text-sm text-accent-800">
            <p className="font-medium">
              Composez *144# si vous n&apos;avez pas recu la demande
            </p>
          </div>
          <button
            onClick={() => setStep("plan")}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  // ── Success step ──
  if (step === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <CheckCircle2 size={40} className="text-primary-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Paiement reussi !
          </h2>
          <p className="mt-2 text-gray-500">
            Votre abonnement {currentPlan.name.toLowerCase()} est maintenant
            actif.
          </p>
          <button
            onClick={() => router.push("/search")}
            className="btn-primary mt-6"
          >
            Trouver un professeur
          </button>
        </div>
      </div>
    );
  }

  // ── Error step ──
  if (step === "error") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <CircleDollarSign size={40} className="text-red-500" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-gray-900">
            Paiement echoue
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Le paiement n&apos;a pas pu etre effectue. Verifiez votre solde
            Orange Money et reessayez.
          </p>
          <button
            onClick={() => setStep("plan")}
            className="btn-primary mt-6"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  // ── Plan selection step ──
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center">
        <Shield size={32} className="mx-auto text-primary-500" />
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          S&apos;abonner a KalanConnect
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Accedez a tous les professeurs
        </p>
      </div>

      {/* Features */}
      <div className="mt-6 rounded-xl bg-primary-50 p-4">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            "Voir tous les profils de professeurs",
            "Contacter les professeurs",
            "Reserver des cours",
            "Messagerie illimitee",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Plan selection */}
      <div className="mt-6 space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
              selectedPlan === plan.id
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2 right-3 rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {plan.badge}
              </span>
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  selectedPlan === plan.id
                    ? "border-primary-500"
                    : "border-gray-300"
                )}
              >
                {selectedPlan === plan.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  {plan.name}
                </span>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(plan.price)}
              </span>
              {plan.id === "annual" && (
                <p className="text-xs text-primary-600">
                  = {formatPrice(plan.perMonth)}/mois
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Orange Money */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Paiement Orange Money
        </h3>
        <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <Phone size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-orange-800">
              Orange Money
            </span>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-600">
              Numero Orange Money
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+223 7X XX XX XX"
              className="input"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Vous recevrez une demande de confirmation sur votre telephone.
          </p>
        </div>
      </div>

      {/* Summary + CTA */}
      <div className="mt-6 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Plan {currentPlan.name}</span>
          <span className="font-semibold">{formatPrice(currentPlan.price)}</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !phoneNumber}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50"
      >
        <Phone size={18} />
        Payer {formatPrice(currentPlan.price)} via Orange Money
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        <Shield size={12} className="mr-1 inline" />
        Paiement securise. En cliquant, vous acceptez les CGU.
      </p>
    </div>
  );
}
