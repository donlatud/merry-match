"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { supabase, supabaseRealtime } from "@/providers/supabase.provider";
import { AuthContext } from "@/contexts/login/AuthContext";

export function useRealtimeChat(roomId, myProfileId, partner) {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const channelRef = useRef(null);
  const partnerRef = useRef(partner);
  const myProfileIdRef = useRef(myProfileId);
  const hasFetchedRef = useRef(false);
  const isSettingUpRef = useRef(false);
  const partnerTypingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);
  const messagesRef = useRef([]);

  const typingIntervalRef = useRef(null);
  const isTypingActiveRef = useRef(false);

  useEffect(() => { partnerRef.current = partner; }, [partner]);
  useEffect(() => { myProfileIdRef.current = myProfileId; }, [myProfileId]);

  const getFreshToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return session.access_token;
  }, []);

  const fetchMessages = useCallback(async (token) => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        messagesRef.current = result.data;
        setMessages(result.data);
      }
    } catch (err) {
      console.error("❌ Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const markAsRead = useCallback(async () => {
    if (!roomId || isMarkingAsReadRef.current) return;
    isMarkingAsReadRef.current = true;
    try {
      const token = await getFreshToken();
      if (!token) return;
      await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("❌ Mark as read error:", err);
    } finally {
      setTimeout(() => { isMarkingAsReadRef.current = false; }, 2000);
    }
  }, [roomId, getFreshToken]);

  // ── broadcast typing ──────────────────────────────────────────
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !myProfileIdRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: myProfileIdRef.current },
    });
  }, []);

  // ── broadcast stop_typing ─────────────────────────────────────
  const broadcastStopTyping = useCallback(() => {
    if (!channelRef.current || !myProfileIdRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { senderId: myProfileIdRef.current },
    });
  }, []);

  const startTyping = useCallback(() => {
    if (isTypingActiveRef.current) return; // already active
    isTypingActiveRef.current = true;
    broadcastTyping();
    typingIntervalRef.current = setInterval(() => {
      if (isTypingActiveRef.current) broadcastTyping();
    }, 2000);
  }, [broadcastTyping]);

  // ✅ stopTyping ส่ง stop_typing event ทันที — partner จะปิด indicator เลย
  const stopTyping = useCallback(() => {
    if (!isTypingActiveRef.current) return; // already stopped
    isTypingActiveRef.current = false;
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    broadcastStopTyping();
  }, [broadcastStopTyping]);

  const onInputChange = useCallback((value) => {
    if (value && value.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  // ── REALTIME SETUP ────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || !roomId || !myProfileId) return;
    if (isSettingUpRef.current) return;
    isSettingUpRef.current = true;

    const setupRealtime = async () => {
      const token = await getFreshToken();
      if (!token) {
        isSettingUpRef.current = false;
        return;
      }

      if (!hasFetchedRef.current) {
        await fetchMessages(token);
        hasFetchedRef.current = true;
        await markAsRead();
      }

      supabaseRealtime.realtime.setAuth(token);

      if (channelRef.current) {
        await supabaseRealtime.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabaseRealtime
        .channel(`room-${roomId}`)

        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        }, async (payload) => {
          if (!payload.new || Object.keys(payload.new).length === 0) return;

          const newMsg = payload.new;
          const currentMyId = myProfileIdRef.current;
          const currentPartner = partnerRef.current;
          const isOwn = String(newMsg.sender_id) === String(currentMyId);

          if (!isOwn) await markAsRead();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || m.realId === newMsg.id)) return prev;

            if (isOwn) {
              const optimisticIndex = prev.findIndex(
                (m) => m.id?.startsWith("temp-") && m.content === newMsg.content
              );
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = {
                  ...updated[optimisticIndex],
                  realId: newMsg.id,
                  isRead: newMsg.is_read,
                  createdAt: newMsg.created_at,
                  isPending: false,
                };
                messagesRef.current = updated;
                return updated;
              }
            }

            const next = [...prev, {
              id: newMsg.id,
              content: newMsg.content,
              senderId: newMsg.sender_id,
              senderName: isOwn ? "Me" : currentPartner?.name || "Partner",
              senderImage: isOwn ? null : currentPartner?.image,
              isOwn,
              isRead: newMsg.is_read,
              createdAt: newMsg.created_at,
              isPending: false,
            }];
            messagesRef.current = next;
            return next;
          });
        })

        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        }, (payload) => {
          if (!payload.new) return;
          const updatedMsg = payload.new;

          const target = messagesRef.current.find(
            (m) => m.id === updatedMsg.id || m.realId === updatedMsg.id
          );
          if (!target) return;
          if (target.isRead === updatedMsg.is_read) return;

          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === updatedMsg.id || m.realId === updatedMsg.id
                ? { ...m, isRead: updatedMsg.is_read }
                : m
            );
            messagesRef.current = next;
            return next;
          });
        })

        // ── typing: partner เริ่มพิมพ์ ───────────────────────────
        .on("broadcast", { event: "typing" }, (payload) => {
          const senderId = payload.payload?.senderId;
          if (String(senderId) === String(myProfileIdRef.current)) return;

          setPartnerTyping(true);

          // fallback timeout กรณี stop_typing ไม่มาถึง
          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
          partnerTypingTimeoutRef.current = setTimeout(() => {
            setPartnerTyping(false);
          }, 5000);
        })

        // ✅ stop_typing: partner ส่งแล้วหรือล้าง input → ปิดทันที
        .on("broadcast", { event: "stop_typing" }, (payload) => {
          const senderId = payload.payload?.senderId;
          if (String(senderId) === String(myProfileIdRef.current)) return;

          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
          setPartnerTyping(false);
        })

        .subscribe((status, err) => {
          console.log("🌐 Realtime status:", status, err ?? "");
          isSettingUpRef.current = false;
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      hasFetchedRef.current = false;
      isSettingUpRef.current = false;
      stopTyping();
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      if (channelRef.current) {
        supabaseRealtime.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, myProfileId, user, authLoading, getFreshToken, fetchMessages, markAsRead, stopTyping]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "TOKEN_REFRESHED" && session?.access_token) {
          supabaseRealtime.realtime.setAuth(session.access_token);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!content?.trim() || !roomId || !user) return;

    stopTyping(); // ✅ ส่ง stop_typing broadcast ทันที
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => {
      const next = [...prev, {
        id: tempId,
        content,
        senderId: myProfileIdRef.current,
        senderName: "Me",
        senderImage: null,
        isOwn: true,
        isPending: true,
        isRead: false,
        createdAt: new Date().toISOString(),
      }];
      messagesRef.current = next;
      return next;
    });

    try {
      const token = await getFreshToken();
      if (!token) throw new Error("No token");

      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Send failed");
    } catch (err) {
      console.error("❌ Send message error:", err);
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== tempId);
        messagesRef.current = next;
        return next;
      });
    } finally {
      setSending(false);
    }
  }, [roomId, user, getFreshToken, stopTyping]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    partnerTyping,
    onInputChange,
  };
}