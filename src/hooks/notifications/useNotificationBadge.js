"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/providers/supabase.provider";

/**
 * Hook สำหรับสถานะ unread ของ notifications (ใช้แสดง ring/badge ใน navbar)
 * @param {{ userId: string | undefined }} options
 * @returns {{ hasUnread: boolean, refresh: () => void, markSeen: () => void }}
 */
export function useNotificationBadge({ userId }) {
  const [hasUnread, setHasUnread] = useState(false);

  const refresh = useCallback(() => {
    if (!userId) return;
    apiClient
      .get("/notifications", { params: { limit: 10 } })
      .then((res) => {
        const items = res.data?.items || [];
        const unread = items.some((item) => {
          if (item.read_at != null) return false;
          const createdAt = item.createdAt
            ? new Date(item.createdAt).getTime()
            : 0;
          const seenAt = item.seen_at ? new Date(item.seen_at).getTime() : null;
          return seenAt == null || createdAt > seenAt;
        });
        setHasUnread(unread);
      })
      .catch(() => {});
  }, [userId]);

  const markSeen = useCallback(() => {
    apiClient.patch("/notifications", { action: "seen" }).catch(() => {});
    setHasUnread(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId, refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { hasUnread, refresh, markSeen };
}
