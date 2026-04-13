"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { chat as chatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";

function fmtPreview(conv: Conversation, myId?: number): string {
  if (!conv.last_message) return "Nouvelle conversation";
  const prefix = conv.last_message.sender_id === myId ? "Vous : " : "";
  const content = conv.last_message.content;
  return prefix + (content.length > 55 ? content.slice(0, 55) + "…" : content);
}

export default function ChatListPage() {
  const router = useRouter();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    chatApi
      .getConversations()
      .then((data) => setConversations(data.results))
      .finally(() => setLoading(false));
  }, [isLoggedIn, authLoading, router]);

  if (authLoading || loading) return <PageLoader />;

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.other_participant.first_name.toLowerCase().includes(q) ||
      c.other_participant.last_name.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0d0f17]">
      {/* ── Header ── */}
      <div className="bg-[#13151f] border-b border-white/5 px-4 pt-6 pb-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-white/40 mt-0.5">{totalUnread} non lu{totalUnread > 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15">
              <MessageCircle size={18} className="text-primary-400" />
            </div>
          </div>

          {/* Search */}
          {conversations.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="mx-auto max-w-2xl px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <MessageCircle size={36} className="text-white/15" />
            </div>
            <div>
              <p className="text-base font-semibold text-white/40">
                {search ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="mt-1 text-sm text-white/25">
                {search ? `Aucun contact nommé "${search}"` : "Trouvez un professeur et envoyez-lui un message"}
              </p>
            </div>
            {!search && (
              <button
                onClick={() => router.push("/search")}
                className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Trouver un professeur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((conv) => {
              const hasUnread = conv.unread_count > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-white/[0.04] ${
                    hasUnread ? "bg-white/[0.03]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={conv.other_participant.avatar}
                      firstName={conv.other_participant.first_name}
                      lastName={conv.other_participant.last_name}
                      size="lg"
                    />
                    {hasUnread && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary-400 ring-2 ring-[#0d0f17]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${hasUnread ? "font-bold text-white" : "font-medium text-white/70"}`}>
                        {conv.other_participant.first_name} {conv.other_participant.last_name}
                      </span>
                      {conv.last_message && (
                        <span className="text-[11px] text-white/25 flex-shrink-0">
                          {formatRelativeTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${hasUnread ? "text-white/60 font-medium" : "text-white/30"}`}>
                        {fmtPreview(conv, user?.id)}
                      </p>
                      {hasUnread && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
