"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Search, User as UserIcon, Bell, Trophy, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { sessions as sessionsApi, concours as concoursApi } from "@/lib/api";
import type { ConcoursEvent } from "@/types";

export default function Navbar() {
  const { user, isLoggedIn, logout, isTeacher, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [openSessionsCount, setOpenSessionsCount] = useState(0);
  const [urgentConcours, setUrgentConcours] = useState<ConcoursEvent | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    concoursApi.list().then((events) => {
      const urgent = events
        .filter((e) => e.days_until_examen <= 30)
        .sort((a, b) => a.days_until_examen - b.days_until_examen)[0] ?? null;
      if (urgent) {
        const key = `concours_banner_${urgent.id}`;
        if (sessionStorage.getItem(key)) {
          setBannerDismissed(true);
        }
        setUrgentConcours(urgent);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    sessionsApi.list({ status: "open", date: "upcoming" })
      .then((res) => setOpenSessionsCount(res.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
            <span className="text-lg font-bold text-white">K</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            Kalan<span className="text-primary-500">Connect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
          >
            <Search size={16} />
            Trouver un prof
          </Link>
          <Link
            href="/events"
            className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
          >
            Événements
            {openSessionsCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
                {openSessionsCount > 9 ? "9+" : openSessionsCount}
              </span>
            )}
          </Link>
          <Link
            href="/concours"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-amber-600"
          >
            <Trophy size={15} className="text-amber-500" />
            Concours
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href={isTeacher ? "/dashboard/teacher" : isAdmin ? "/dashboard/admin" : "/dashboard"}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                <LayoutDashboard size={15} />
                Mon espace
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                Messages
              </Link>

              {/* Cloche notifications */}
              <Link
                href="/profile/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                title="Notifications"
              >
                <Bell size={17} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                  <UserIcon size={16} className="text-primary-600" />
                </div>
                {user?.first_name}
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Quitter
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm">
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>

        {/* Mobile : cloche + menu */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && (
            <Link
              href="/profile/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white"
            >
              <Bell size={17} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Concours urgency banner */}
      {urgentConcours && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border-t border-amber-200 px-4 py-2 text-sm">
          <div className="flex items-center gap-2 text-amber-800 min-w-0">
            <Trophy size={14} className="flex-shrink-0 text-amber-600" />
            <span className="truncate">
              <span className="font-semibold">{urgentConcours.type_display}</span>
              {" — "}
              {urgentConcours.days_until_examen === 0
                ? "Examen aujourd'hui !"
                : urgentConcours.days_until_examen === 1
                ? "Examen demain !"
                : `Examen dans ${urgentConcours.days_until_examen} jour${urgentConcours.days_until_examen > 1 ? "s" : ""}`}
              {urgentConcours.days_until_inscription !== null && urgentConcours.days_until_inscription >= 0 && (
                <span className="ml-2 text-amber-600">
                  · Inscriptions : J-{urgentConcours.days_until_inscription}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/concours" className="font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2">
              Voir les détails
            </a>
            <button
              onClick={() => {
                sessionStorage.setItem(`concours_banner_${urgentConcours.id}`, "1");
                setBannerDismissed(true);
              }}
              className="text-amber-500 hover:text-amber-700"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/search"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Trouver un professeur
            </Link>
            <Link
              href="/events"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              <span>Événements</span>
              {openSessionsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
                  {openSessionsCount > 9 ? "9+" : openSessionsCount}
                </span>
              )}
            </Link>
            <Link
              href="/concours"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setMobileOpen(false)}
            >
              <Trophy size={15} className="text-amber-500" />
              Concours
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href={isTeacher ? "/dashboard/teacher" : isAdmin ? "/dashboard/admin" : "/dashboard"}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={15} className="text-gray-400" />
                  Mon espace
                </Link>
                <Link
                  href="/chat"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Mon profil
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
