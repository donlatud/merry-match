"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { isPremiumMembership } from "@/lib/membershipHelpers";
import { supabase } from "@/providers/supabase.provider";

export function useNotificationFeed(limitValue = 50) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const limit = useMemo(() => limitValue, [limitValue]);

  useEffect(() => {
    apiClient
      .get("/me")
      .then((res) => setMe(res.data ?? null))
      .catch(() => setMe(null));
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/notifications", {
        params: { limit },
      });
      const next = Array.isArray(res.data?.items) ? res.data.items : [];
      setItems(next);
    } catch (error) {
      console.error("fetchNotifications error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    items,
    loading,
    me,
    isPremiumMembership: isPremiumMembership(me?.subscription),
    refreshNotifications: fetchNotifications,
  };
}
