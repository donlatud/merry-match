"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { supabase, supabaseRealtime } from "@/providers/supabase.provider";
import { AuthContext } from "@/contexts/login/AuthContext";

export function useRealtimeChatList() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const roomsRef = useRef([]);
  const msgChannelsRef = useRef([]);
  const myProfileIdRef = useRef(null);

  const getFreshToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  // ── fetch rooms ───────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getFreshToken();
      if (!token) return;
      const res = await fetch("/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!result.success) return;
      const toMs = (t) => { const s = String(t || ""); return new Date(s.endsWith("Z") ? s : s + "Z").getTime(); };
      const sorted = result.data.sort((a, b) => toMs(b.lastMessageAt) - toMs(a.lastMessageAt));
      roomsRef.current = sorted;
      setRooms(sorted);
      if (result.data.length > 0) {
        myProfileIdRef.current = result.data[0].myProfileId;
      }
      return result.data;
    } catch (err) {
      console.error("❌ Fetch rooms error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getFreshToken]);

  // ── subscribe channels ────────────────────────────────────────
  const subscribeMsgChannels = useCallback(async (currentRooms) => {
    const token = await getFreshToken();
    if (!token) return;
    supabaseRealtime.realtime.setAuth(token);

    for (const ch of msgChannelsRef.current) {
      await supabaseRealtime.removeChannel(ch);
    }
    msgChannelsRef.current = [];

    currentRooms.forEach((room) => {
      const channel = supabaseRealtime
        .channel(`chatlist-msg-${room.roomId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public",
          table: "messages", filter: `room_id=eq.${room.roomId}`,
        }, (payload) => {
          if (!payload.new || Object.keys(payload.new).length === 0) return;
          const newMsg = payload.new;
          const isOwn = String(newMsg.sender_id) === String(myProfileIdRef.current);

          // ✅ ถ้า user กำลังอยู่ในห้องนี้อยู่ ไม่เพิ่ม unread
          const isCurrentRoom = typeof window !== "undefined" &&
            window.location.pathname === `/chat/${room.roomId}`;

          setRooms((prev) => {
            const updated = prev.map((r) => {
              if (r.roomId !== room.roomId) return r;
              const lastMessage = isOwn
                ? `You: ${newMsg.message_type === "image" ? "📷 Image" : newMsg.content}`
                : newMsg.message_type === "image" ? "📷 Image" : newMsg.content;
              return {
                ...r,
                lastMessage,
                lastMessageAt: newMsg.created_at,
                unreadCount: (isOwn || isCurrentRoom)
                  ? r.unreadCount
                  : (r.unreadCount ?? 0) + 1,
              };
            });
            updated.sort((a, b) => {
              const toMs = (t) => {
                if (!t) return 0;
                const s = String(t);
                return new Date(s.endsWith("Z") ? s : s + "Z").getTime();
              };
              return toMs(b.lastMessageAt) - toMs(a.lastMessageAt);
            });
            roomsRef.current = updated;
            return updated;
          });
        })
        .subscribe();
      msgChannelsRef.current.push(channel);
    });
  }, [getFreshToken]);

  // ── refetch + re-subscribe (เรียกจาก parent ได้ เช่น ตอน match) ──
  const refetchRooms = useCallback(async () => {
    const updatedRooms = await fetchRooms();
    if (updatedRooms?.length) {
      await subscribeMsgChannels(updatedRooms);
    }
  }, [fetchRooms, subscribeMsgChannels]);

  // ── init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      const initialRooms = await fetchRooms();
      if (cancelled || !initialRooms?.length) return;
      await subscribeMsgChannels(initialRooms);
    };

    init();

    return () => {
      cancelled = true;
      for (const ch of msgChannelsRef.current) {
        supabaseRealtime.removeChannel(ch);
      }
      msgChannelsRef.current = [];
    };
  }, [user]);

  // ── token refresh ─────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        supabaseRealtime.realtime.setAuth(session.access_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── reset unread เมื่อกดเข้าห้อง ─────────────────────────────
  const markRoomAsRead = useCallback((roomId) => {
    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.roomId === roomId ? { ...r, unreadCount: 0 } : r
      );
      roomsRef.current = updated;
      return updated;
    });
  }, []);

  // ── ฟัง event จาก useRealtimeChat ตอนเปิดห้อง ────────────────
  useEffect(() => {
    const handler = (e) => markRoomAsRead(e.detail.roomId);
    window.addEventListener("chat:markAsRead", handler);
    return () => window.removeEventListener("chat:markAsRead", handler);
  }, [markRoomAsRead]);

  return { rooms, loading, markRoomAsRead, refetchRooms };
}