"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { chat as chatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const conversationId = Number(params.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{
    first_name: string;
    last_name: string;
    avatar: string | null;
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages + conversation info
  useEffect(() => {
    Promise.all([
      chatApi.getMessages(conversationId),
      chatApi.getConversations(),
    ])
      .then(([msgData, convData]) => {
        setMessages(msgData.results);
        const conv = convData.results.find(
          (c: Conversation) => c.id === conversationId
        );
        if (conv) setOtherUser(conv.other_participant);
        // Mark as read
        chatApi.markAsRead(conversationId);
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket connection
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
            content: data.data.content,
            message_type: data.data.message_type,
            attachment: null,
            is_read: false,
            created_at: data.data.created_at,
          },
        ]);
      }

      if (data.type === "typing") {
        setIsTyping(data.is_typing);
      }

      if (data.type === "read") {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, is_read: true }))
        );
      }
    };

    return () => {
      ws.close();
    };
  }, [conversationId]);

  const sendMessage = () => {
    const content = newMessage.trim();
    if (!content || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({ type: "text", content })
    );
    setNewMessage("");
  };

  const handleTyping = () => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({ type: "typing", is_typing: false })
      );
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button
          onClick={() => router.push("/chat")}
          className="text-gray-500 hover:text-gray-700 md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        {otherUser && (
          <>
            <Avatar
              src={otherUser.avatar}
              firstName={otherUser.first_name}
              lastName={otherUser.last_name}
              size="md"
            />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {otherUser.first_name} {otherUser.last_name}
              </h2>
              {isTyping && (
                <p className="text-xs text-primary-500">
                  En train d&apos;ecrire...
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg) => {
            const isMine = msg.sender.id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isMine
                      ? "rounded-tr-sm bg-primary-500 text-white"
                      : "rounded-tl-sm bg-gray-100 text-gray-800"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs",
                      isMine ? "justify-end text-primary-200" : "text-gray-400"
                    )}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine && (
                      <span>{msg.is_read ? "✓✓" : "✓"}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <button className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Paperclip size={20} />
          </button>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              rows={1}
              className="input max-h-32 resize-none !rounded-2xl !py-2.5"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="flex-shrink-0 rounded-xl bg-primary-500 p-2.5 text-white transition-all hover:bg-primary-600 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
