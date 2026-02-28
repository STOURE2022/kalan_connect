"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Star,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isLoggedIn, logout, hasSubscription } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/auth/login");
    }
  }, [loading, isLoggedIn, router]);

  if (loading || !user) return <PageLoader />;

  const menuItems = [
    {
      icon: CalendarDays,
      label: "Mes reservations",
      href: "/profile/bookings",
      badge: null,
    },
    {
      icon: Star,
      label: "Mes avis",
      href: "/profile/reviews",
      badge: null,
    },
    {
      icon: CreditCard,
      label: "Historique paiements",
      href: "/profile/payments",
      badge: null,
    },
    {
      icon: Settings,
      label: "Parametres",
      href: "/profile/settings",
      badge: null,
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/profile/notifications",
      badge: null,
    },
    {
      icon: HelpCircle,
      label: "Aide & Support",
      href: "/profile/help",
      badge: null,
    },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {/* User card */}
      <div className="card mt-4 flex items-center gap-4">
        <Avatar
          src={user.avatar}
          firstName={user.first_name}
          lastName={user.last_name}
          size="xl"
        />
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-sm text-gray-500">{user.phone}</p>
          <p className="text-sm text-gray-500">
            {user.neighborhood ? `${user.neighborhood}, ` : ""}
            {user.city}
          </p>
          <span className="badge-green mt-1">
            {user.role === "parent" ? "Parent" : "Professeur"}
          </span>
        </div>
      </div>

      {/* Subscription status */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Mon abonnement
            </h3>
            {hasSubscription ? (
              <div className="mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-primary-500" />
                <span className="text-sm font-medium text-primary-600">
                  Actif
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-400">
                Aucun abonnement actif
              </p>
            )}
          </div>
          {!hasSubscription && (
            <Link href="/payment" className="btn-primary text-sm">
              S&apos;abonner
            </Link>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mt-4 space-y-1">
        {menuItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {label}
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-500 transition-colors hover:bg-red-50"
      >
        <LogOut size={20} />
        <span className="text-sm font-medium">Se deconnecter</span>
      </button>
    </div>
  );
}
