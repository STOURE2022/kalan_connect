"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Flag, TrendingUp, LogOut, Menu, X, Bell,
  ChevronRight, Shield, CreditCard, Star, ExternalLink, Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";

const NAV = [
  { href: "/dashboard/admin",                icon: LayoutDashboard, label: "Vue d'ensemble",   exact: true  },
  { href: "/dashboard/admin/users",          icon: Users,           label: "Utilisateurs"                   },
  { href: "/dashboard/admin/teachers",       icon: GraduationCap,   label: "Professeurs"                    },
  { href: "/dashboard/admin/bookings",       icon: BookOpen,        label: "Réservations"                   },
  { href: "/dashboard/admin/subscriptions",  icon: CreditCard,      label: "Abonnements"                    },
  { href: "/dashboard/admin/reviews",        icon: Star,            label: "Avis"                           },
  { href: "/dashboard/admin/reports",        icon: Flag,            label: "Signalements"                   },
  { href: "/dashboard/admin/revenue",        icon: TrendingUp,      label: "Revenus"                        },
  { href: "/dashboard/admin/concours",       icon: Trophy,          label: "Concours"                       },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isLoggedIn, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isAdmin)) router.replace("/auth/login");
  }, [loading, isLoggedIn, isAdmin, router]);

  if (loading || !user) return <PageLoader />;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#13151f] border-r border-white/5
        transition-transform duration-300 md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">KalanConnect</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden">
            <X size={16} className="text-white/40" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  ${active
                    ? "bg-primary-500/15 text-primary-400 border border-primary-500/20"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }
                `}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Django Admin link */}
        <div className="px-3 pb-2">
          <a
            href={`${(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/v1\/?$/, "")}/admin/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/5 transition-all"
          >
            <ExternalLink size={16} />
            Django Admin
            <span className="ml-auto text-[10px] bg-amber-400/10 text-amber-400/70 px-1.5 py-0.5 rounded">CHAT</span>
          </a>
        </div>

        {/* User */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 text-xs font-bold flex-shrink-0">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.first_name} {user.last_name}</p>
              <p className="text-[10px] text-white/40">Administrateur</p>
            </div>
            <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors" title="Déconnexion">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#13151f] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden rounded-lg p-1.5 hover:bg-white/5">
              <Menu size={18} className="text-white/60" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-white/30">
              <Shield size={12} className="text-primary-400" />
              <span className="text-primary-400 font-semibold">Admin</span>
              {pathname !== "/dashboard/admin" && (
                <>
                  <span>/</span>
                  <span className="text-white/60 capitalize">
                    {NAV.find((n) => pathname.startsWith(n.href) && !n.exact)?.label ?? ""}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
              <Bell size={15} className="text-white/50" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold">
                {user.first_name[0]}
              </div>
              <span className="text-xs text-white/70 hidden sm:block">{user.first_name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
