"use client";

import { useEffect, useState, useCallback } from "react";
import { getAccessToken } from "@/lib/api";
import { useAuth } from "./useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function useNotifications(pollIntervalMs = 30_000) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch_ = useCallback(async () => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications/unread-count/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silently ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetch_, pollIntervalMs]);

  const markAllRead = useCallback(async () => {
    const token = getAccessToken();
    await fetch(`${API}/notifications/read-all/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setUnreadCount(0);
  }, []);

  return { unreadCount, refresh: fetch_, markAllRead };
}
