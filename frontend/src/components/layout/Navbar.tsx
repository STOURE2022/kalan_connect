"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                Messages
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

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

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
            {isLoggedIn ? (
              <>
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
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Se deconnecter
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
