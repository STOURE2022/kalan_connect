"use client";

import { getAccessToken } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BookOpen, Star, MessageCircle, CreditCard, Info, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";

interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "booking" | "review" | "system" | "chat" | "payment";
  is_read: boolean;
  data?: { conversation_id?: number; [key: string]: unknown };
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  booking: { icon: BookOpen,      color: "text-blue-600",    bg: "bg-blue-100"    },
  review:  { icon: Star,          color: "text-accent-600",  bg: "bg-accent-100"  },
  chat:    { icon: MessageCircle, color: "text-purple-600",  bg: "bg-purple-100"  },
  payment: { icon: CreditCard,    color: "text-primary-600", bg: "bg-primary-100" },
  system:  { icon: Info,          color: "text-gray-600",    bg: "bg-gray-100"    },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/auth/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setNotifications(list);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  const markAllRead = async () => {
    const token = getAccessToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) return <PageLoader />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <Bell size={32} className="text-gray-300" />
          <div>
            <p className="font-semibold text-gray-600">Aucune notification</p>
            <p className="mt-1 text-sm text-gray-400">Vous êtes à jour !</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
            const Icon = cfg.icon;
            const conversationId = notif.type === "chat" ? notif.data?.conversation_id : null;

            const handleClick = async () => {
              // Marquer comme lu
              if (!notif.is_read) {
                const token = getAccessToken();
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notif.id}/read/`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }).catch(() => {});
                setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
              }
              if (conversationId) router.push(`/chat/${conversationId}`);
            };

            return (
              <div
                key={notif.id}
                onClick={conversationId ? handleClick : undefined}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  conversationId ? "cursor-pointer" : ""
                } ${!notif.is_read ? "bg-primary-50/40" : "hover:bg-gray-50"}`}
              >
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.is_read ? "text-gray-900" : "text-gray-700"}`}>
                      {notif.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(notif.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{notif.message}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 mt-1">
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                  )}
                  {conversationId && (
                    <ChevronRight size={14} className="text-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
