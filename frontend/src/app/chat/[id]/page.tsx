"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, CheckCheck, Check,
  Paperclip, X, FileText, Smile,
} from "lucide-react";
import { chat as chatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { Conversation, Message } from "@/types";

// ── Helpers ──────────────────────────────────────────────
function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ── Emoji data ────────────────────────────────────────────
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀","😂","🥲","😊","😇","🙂","😉","😍","🥰","😘","😜","🤩","😎","🤔","😮","😢","😡","🥳","🤗","🫡","😴","🤯","🥺","😤","🤭"],
  },
  {
    label: "Gestes",
    emojis: ["👍","👎","👌","🤙","✌️","🙌","👏","🙏","💪","🤝","👋","🤞","✋","🫶","❤️","💔","💯","🔥","⭐","🎉","🎊","🎁","🏆","✅","❌"],
  },
  {
    label: "Divers",
    emojis: ["📚","📝","💡","🔔","📞","💬","📷","📎","🗂️","🕐","📅","📌","🌍","🏠","🚗","✈️","🍕","☕","🎵","💻","📱","💰","🛒","🔑","🌟"],
  },
];

// ── Sub-components ────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-2xl bg-[#1a1c28] border border-white/10 shadow-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            onClick={() => setTab(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === i ? "text-primary-400 border-b-2 border-primary-400" : "text-white/40 hover:text-white/70"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-40 overflow-y-auto">
        {EMOJI_GROUPS[tab].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onPick(emoji)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-lg hover:bg-white/10 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubbleContent({ msg }: { msg: Message }) {
  if (msg.message_type === "image" && msg.attachment_url) {
    return (
      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={msg.attachment_url}
          alt={msg.attachment_name ?? "photo"}
          className="max-w-full rounded-xl max-h-60 object-cover"
        />
      </a>
    );
  }

  if (msg.message_type === "file" && msg.attachment_url) {
    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm underline underline-offset-2 opacity-90 hover:opacity-100"
      >
        <FileText size={16} className="flex-shrink-0" />
        <span className="truncate max-w-[200px]">{msg.attachment_name ?? "Fichier"}</span>
      </a>
    );
  }

  return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>;
}

// ── Main page ─────────────────────────────────────────────
export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const conversationId = Number(params.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<Conversation["other_participant"] | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load messages + conversation
  useEffect(() => {
    Promise.all([chatApi.getMessages(conversationId), chatApi.getConversations()])
      .then(([msgData, convData]) => {
        setMessages(msgData.results);
        const conv = convData.results.find((c: Conversation) => c.id === conversationId);
        if (conv) setOtherUser(conv.other_participant);
        chatApi.markAsRead(conversationId);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 50);
      });
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket
  useEffect(() => {
    const ws = chatApi.connectWebSocket(conversationId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.data.id,
            conversation: conversationId,
            sender: {
              id: data.data.sender_id,
              first_name: data.data.sender_name.split(" ")[0],
              last_name: data.data.sender_name.split(" ")[1] || "",
              avatar: null,
              role: "",
            },
            content: data.data.content ?? "",
            message_type: data.data.message_type,
            attachment: null,
            attachment_url: data.data.attachment_url ?? null,
            attachment_name: data.data.attachment_name ?? null,
            is_read: false,
            created_at: data.data.created_at,
          },
        ]);
        setSending(false);
      }
      if (data.type === "typing") setIsTyping(data.is_typing);
      if (data.type === "read") setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    };

    return () => ws.close();
  }, [conversationId]);

  const sendMessage = () => {
    const content = newMessage.trim();
    if (!content || !wsRef.current) return;
    setSending(true);
    wsRef.current.send(JSON.stringify({ type: "text", content }));
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // Upload attachment — do NOT add to state here, WS broadcast will deliver it
  const sendAttachment = async () => {
    if (!pendingFile) return;
    setSending(true);
    try {
      await chatApi.uploadAttachment(conversationId, pendingFile);
    } finally {
      setSending(false);
      clearPendingFile();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(file));
    } else {
      setPendingPreview(null);
    }
    e.target.value = "";
  };

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) { setNewMessage((p) => p + emoji); return; }
    const start = ta.selectionStart ?? newMessage.length;
    const end = ta.selectionEnd ?? newMessage.length;
    const updated = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(updated);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
    setShowEmoji(false);
  };

  const handleTyping = () => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({ type: "typing", is_typing: false }));
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col bg-[#0d0f17]">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 bg-[#13151f] border-b border-white/5 px-4 py-3 shadow-sm">
        <button
          onClick={() => router.push("/chat")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70"
        >
          <ArrowLeft size={18} />
        </button>

        {otherUser ? (
          <>
            <div className="relative">
              <Avatar src={otherUser.avatar} firstName={otherUser.first_name} lastName={otherUser.last_name} size="md" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary-400 ring-2 ring-[#13151f]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">
                {otherUser.first_name} {otherUser.last_name}
              </h2>
              <p className="text-xs text-primary-400">{isTyping ? "En train d'écrire..." : "En ligne"}</p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Send size={28} className="text-white/20 -rotate-12" />
            </div>
            <p className="text-sm font-medium text-white/30">Aucun message pour l&apos;instant</p>
            <p className="text-xs text-white/20">Soyez le premier à dire bonjour 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.sender.id === user?.id;
              const prevMsg = messages[idx - 1];
              const showDay = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
              const isLast = idx === messages.length - 1;

              return (
                <div key={msg.id}>
                  {showDay && (
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[11px] font-medium text-white/30 px-3 py-1 rounded-full bg-white/5">
                        {fmtDay(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  )}

                  <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                    {!isMine && (
                      <div className="mr-2 mt-auto flex-shrink-0">
                        <Avatar src={otherUser?.avatar ?? null} firstName={msg.sender.first_name} lastName={msg.sender.last_name} size="sm" />
                      </div>
                    )}
                    <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 ${
                          isMine
                            ? "bg-primary-500 text-white rounded-2xl rounded-br-sm"
                            : "bg-[#1e2130] text-white/90 rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        <MessageBubbleContent msg={msg} />
                      </div>
                      <div className={`flex items-center gap-1 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-white/25">{fmtTime(msg.created_at)}</span>
                        {isMine && isLast && (
                          msg.is_read
                            ? <CheckCheck size={12} className="text-primary-400" />
                            : <Check size={12} className="text-white/25" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                {otherUser && (
                  <div className="mr-2 flex-shrink-0">
                    <Avatar src={otherUser.avatar} firstName={otherUser.first_name} lastName={otherUser.last_name} size="sm" />
                  </div>
                )}
                <div className="bg-[#1e2130] rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── File preview ── */}
      {pendingFile && (
        <div className="flex-shrink-0 bg-[#13151f] border-t border-white/5 px-4 pt-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            {pendingPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pendingPreview} alt="preview" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <FileText size={20} className="text-white/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-white/40">
                {pendingPreview ? "Image" : "Fichier"} · {(pendingFile.size / 1024).toFixed(0)} Ko
              </p>
            </div>
            <button
              onClick={clearPendingFile}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="flex-shrink-0 bg-[#13151f] border-t border-white/5 px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-end gap-2">
          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
          >
            <Paperclip size={20} className={pendingFile ? "text-primary-400" : ""} />
          </button>

          {/* Emoji */}
          <div className="relative flex-shrink-0" ref={emojiRef}>
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ${
                showEmoji ? "text-primary-400" : "text-white/50 hover:text-white/80"
              }`}
            >
              <Smile size={20} />
            </button>
            {showEmoji && <EmojiPicker onPick={insertEmoji} />}
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? "Message optionnel..." : "Votre message..."}
              rows={1}
              disabled={!!pendingFile}
              className="w-full resize-none rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-primary-500/50 transition-colors max-h-32 leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ height: "auto", minHeight: "46px" }}
            />
          </div>

          {/* Send */}
          <button
            onClick={pendingFile ? sendAttachment : sendMessage}
            disabled={(!newMessage.trim() && !pendingFile) || sending}
            className="flex-shrink-0 flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {sending
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : <Send size={18} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
