"use client";

import { useEffect, useState, useCallback } from "react";
import { notifications as notificationsApi } from "@/lib/api";
import { useAuth } from "./useAuth";

export function useNotifications(pollIntervalMs = 30_000) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch_ = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silently ignore (apiFetch gère le refresh et redirige si session expirée)
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetch_, pollIntervalMs]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  return { unreadCount, refresh: fetch_, markAllRead };
}
