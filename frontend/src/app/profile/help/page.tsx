"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  Search,
  BookOpen,
  CreditCard,
  CalendarDays,
  Star,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";

const CATEGORIES = [
  { key: "all",       label: "Tout",         icon: Sparkles    },
  { key: "booking",   label: "Réservations", icon: CalendarDays },
  { key: "payment",   label: "Paiements",    icon: CreditCard   },
  { key: "review",    label: "Avis",         icon: Star         },
  { key: "account",   label: "Compte",       icon: AlertCircle  },
];

const FAQS = [
  {
    category: "booking",
    q: "Comment réserver un cours ?",
    a: "Recherchez un professeur via 'Trouver un prof', consultez son profil, puis cliquez sur 'Réserver'. Vous devez avoir un abonnement actif pour effectuer une réservation.",
  },
  {
    category: "booking",
    q: "Comment annuler une réservation ?",
    a: "Allez dans 'Mes réservations', sélectionnez la réservation concernée et cliquez sur 'Annuler'. L'annulation est possible avant que le cours commence.",
  },
  {
    category: "booking",
    q: "Comment contacter un professeur ?",
    a: "Une fois sur le profil d'un professeur, cliquez sur le bouton 'Message' pour ouvrir une conversation. Vous pouvez également l'écrire depuis la section Messages.",
  },
  {
    category: "payment",
    q: "Comment fonctionne l'abonnement ?",
    a: "L'abonnement mensuel (1 500 FCFA) ou annuel (15 000 FCFA) vous donne accès à tous les professeurs et permet de réserver autant de cours que vous souhaitez.",
  },
  {
    category: "payment",
    q: "Mon paiement n'a pas été validé, que faire ?",
    a: "Vérifiez que votre solde Orange Money est suffisant. Si le problème persiste, contactez notre support via WhatsApp ou email.",
  },
  {
    category: "payment",
    q: "Puis-je changer de plan d'abonnement ?",
    a: "Oui, vous pouvez passer d'un abonnement mensuel à annuel depuis la section Abonnement de votre profil. Le changement prend effet à la prochaine période.",
  },
  {
    category: "review",
    q: "Comment laisser un avis ?",
    a: "Après qu'un cours soit marqué comme terminé, vous recevrez une notification vous invitant à laisser un avis. Vous pouvez aussi le faire depuis 'Mes avis'.",
  },
  {
    category: "review",
    q: "Puis-je modifier un avis que j'ai laissé ?",
    a: "Pour l'instant, les avis ne peuvent pas être modifiés après publication. Contactez notre support si vous avez laissé un avis par erreur.",
  },
  {
    category: "account",
    q: "Comment modifier mes informations personnelles ?",
    a: "Allez dans Profil → Paramètres. Vous pouvez modifier votre prénom, nom, ville et quartier directement depuis cette page.",
  },
  {
    category: "account",
    q: "Comment supprimer mon compte ?",
    a: "Dans Paramètres, faites défiler jusqu'à la 'Zone dangereuse' et cliquez sur 'Supprimer mon compte'. Cette action est irréversible.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`group transition-all duration-200 ${
        open ? "bg-primary-50/60" : "hover:bg-gray-50/80"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
            {index + 1}
          </span>
          <span className={`text-sm font-semibold leading-snug transition-colors ${open ? "text-primary-700" : "text-gray-800"}`}>
            {q}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`mt-0.5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-primary-500" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-6 pb-5 pl-[3.75rem] text-sm leading-relaxed text-gray-500">{a}</p>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    return FAQS.filter((f) => {
      const matchCat = activeCategory === "all" || f.category === activeCategory;
      const matchQ = query.length < 2 || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 px-4 pb-28 pt-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-2xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <p className="text-sm font-medium text-primary-100">Centre d&apos;aide</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Comment pouvons-nous vous aider ?</h1>
          <p className="mt-1.5 text-sm text-primary-100">Trouvez rapidement une réponse à votre question</p>

          {/* Search */}
          <div className="relative mt-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm shadow-lg shadow-primary-900/10 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* Contact strip — pulled up over hero */}
        <div className="relative z-10 -mt-16 mb-8 grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: "WhatsApp", gradient: "from-green-500 to-emerald-500", href: "https://wa.me/22370000000" },
            { icon: Mail,          label: "Email",    gradient: "from-blue-500 to-indigo-500",   href: "mailto:support@kalanconnect.ml" },
            { icon: Phone,         label: "Appel",    gradient: "from-purple-500 to-pink-500",   href: "tel:+22370000000" },
          ].map(({ icon: Icon, label, gradient, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold">{label}</span>
              <ExternalLink size={10} className="opacity-60" />
            </a>
          ))}
        </div>

        {/* Category pills */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeCategory === key
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/30"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-primary-200 hover:text-primary-600"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="mb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
              <Search size={28} className="text-gray-300" />
              <p className="font-semibold text-gray-500">Aucun résultat</p>
              <p className="text-sm text-gray-400">Contactez-nous directement via WhatsApp</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100/80">
              {filtered.map((faq, i) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-emerald-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-100">
              <BookOpen size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Vous n&apos;avez pas trouvé votre réponse ?</p>
              <p className="mt-0.5 text-sm text-gray-500">Notre équipe répond en moins de 24h</p>
            </div>
          </div>
          <a
            href="https://wa.me/22370000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-colors"
          >
            <MessageCircle size={16} />
            Contacter le support WhatsApp
          </a>
        </div>

        <p className="pb-8 text-center text-xs text-gray-300">
          KalanConnect · Bamako, Mali · v1.0
        </p>
      </div>
    </div>
  );
}
