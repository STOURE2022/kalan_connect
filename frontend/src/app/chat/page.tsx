"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { chat as chatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

export default function ChatListPage() {
  const router = useRouter();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    chatApi
      .getConversations()
      .then((data) => setConversations(data.results))
      .finally(() => setLoading(false));
  }, [isLoggedIn, authLoading, router]);

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MessageCircle size={48} className="text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-600">
            Aucune conversation
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Trouvez un professeur et envoyez-lui un message
          </p>
          <button
            onClick={() => router.push("/search")}
            className="btn-primary mt-4"
          >
            Trouver un professeur
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-gray-50",
                conv.unread_count > 0 && "bg-primary-50/50"
              )}
            >
              <Avatar
                src={conv.other_participant.avatar}
                firstName={conv.other_participant.first_name}
                lastName={conv.other_participant.last_name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      "text-sm",
                      conv.unread_count > 0
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-700"
                    )}
                  >
                    {conv.other_participant.first_name}{" "}
                    {conv.other_participant.last_name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {conv.last_message
                      ? formatRelativeTime(conv.last_message.created_at)
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "truncate text-sm",
                      conv.unread_count > 0
                        ? "font-medium text-gray-800"
                        : "text-gray-500"
                    )}
                  >
                    {conv.last_message
                      ? truncate(conv.last_message.content, 50)
                      : "Nouvelle conversation"}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs font-bold text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
