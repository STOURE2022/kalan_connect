"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, CalendarDays, MessageCircle, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();

  const tabs = [
    { href: "/",               icon: Home,          label: "Accueil"  },
    { href: "/search",         icon: Search,        label: "Recherche" },
    { href: "/profile/bookings", icon: CalendarDays, label: "Cours"   },
    { href: "/chat",           icon: MessageCircle, label: "Chat"     },
    { href: "/profile",        icon: User,          label: "Profil"   },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe md:hidden">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          const isChatTab = href === "/chat";

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              {/* Badge notifications sur le chat */}
              {isChatTab && isLoggedIn && unreadCount > 0 && (
                <span className="absolute -right-0.5 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className={cn("font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
