"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { supabase, supabaseRealtime } from "@/providers/supabase.provider";
import { AuthContext } from "@/contexts/login/AuthContext";

const CHAT_BUCKET = "chat-images";

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

  // ✅ Map สำหรับ pending messages
  // key: content (text) หรือ "@@image" (image) → value: tempId
  // ใช้เพื่อ replace optimistic แม้ INSERT event มาก่อน state update
  const pendingMapRef = useRef(new Map());

  useEffect(() => {
    partnerRef.current = partner;
  }, [partner]);
  useEffect(() => {
    myProfileIdRef.current = myProfileId;
  }, [myProfileId]);

  const getFreshToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const fetchMessages = useCallback(
    async (token) => {
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
    },
    [roomId],
  );

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
      setTimeout(() => {
        isMarkingAsReadRef.current = false;
      }, 2000);
    }
  }, [roomId, getFreshToken]);

  // ── typing ────────────────────────────────────────────────────
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !myProfileIdRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: myProfileIdRef.current },
    });
  }, []);

  const broadcastStopTyping = useCallback(() => {
    if (!channelRef.current || !myProfileIdRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { senderId: myProfileIdRef.current },
    });
  }, []);

  const startTyping = useCallback(() => {
    if (isTypingActiveRef.current) return;
    isTypingActiveRef.current = true;
    broadcastTyping();
    typingIntervalRef.current = setInterval(() => {
      if (isTypingActiveRef.current) broadcastTyping();
    }, 2000);
  }, [broadcastTyping]);

  const stopTyping = useCallback(() => {
    if (!isTypingActiveRef.current) return;
    isTypingActiveRef.current = false;
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    broadcastStopTyping();
  }, [broadcastStopTyping]);

  const onInputChange = useCallback(
    (value) => {
      if (value?.trim().length > 0) startTyping();
      else stopTyping();
    },
    [startTyping, stopTyping],
  );

  const mapMessage = useCallback((newMsg, isOwn) => {
    const currentPartner = partnerRef.current;
    return {
      id: newMsg.id,
      content: newMsg.content,
      messageType: newMsg.message_type ?? "text",
      imageUrls: newMsg.image_urls ?? [],
      senderId: newMsg.sender_id,
      senderName: isOwn ? "Me" : currentPartner?.name || "Partner",
      senderImage: isOwn ? null : currentPartner?.image,
      isOwn,
      isRead: newMsg.is_read,
      createdAt: newMsg.created_at,
      isPending: false,
    };
  }, []);

  // ── REALTIME SETUP ────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || !roomId || !myProfileId) return;
    if (isSettingUpRef.current) return;
    isSettingUpRef.current = true;

    myProfileIdRef.current = myProfileId;

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
        window.dispatchEvent(
          new CustomEvent("chat:markAsRead", { detail: { roomId } }),
        );
      }

      supabaseRealtime.realtime.setAuth(token);

      if (channelRef.current) {
        await supabaseRealtime.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabaseRealtime
        .channel(`room-${roomId}`)

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            if (!payload.new || Object.keys(payload.new).length === 0) return;

            const newMsg = payload.new;
            const currentMyId = myProfileIdRef.current;
            const isOwn = String(newMsg.sender_id) === String(currentMyId);

            if (!isOwn) await markAsRead();

            // ✅ หา tempId จาก pendingMap โดยตรง — ไม่ต้อง match content
            const msgKey =
              newMsg.message_type === "image" ? "@@image" : newMsg.content;
            const knownTempId = isOwn
              ? pendingMapRef.current.get(msgKey)
              : null;
            if (knownTempId) pendingMapRef.current.delete(msgKey);

            setMessages((prev) => {
              if (
                prev.some((m) => m.id === newMsg.id || m.realId === newMsg.id)
              )
                return prev;

              if (isOwn) {
                // ✅ เช็ค tempId ตรงๆ ก่อน (กัน race condition)
                const byTempId = knownTempId
                  ? prev.findIndex((m) => m.id === knownTempId)
                  : -1;

                // fallback: หาจาก content เหมือนเดิม
                const optimisticIndex =
                  byTempId !== -1
                    ? byTempId
                    : prev.findIndex(
                        (m) =>
                          m.id?.startsWith("temp-") &&
                          m.isPending &&
                          (m.content === newMsg.content ||
                            (m.messageType === "image" &&
                              newMsg.message_type === "image")),
                      );

                if (optimisticIndex !== -1) {
                  const updated = [...prev];
                  updated[optimisticIndex] = {
                    ...updated[optimisticIndex],
                    realId: newMsg.id,
                    imageUrls: newMsg.image_urls?.length
                      ? newMsg.image_urls
                      : updated[optimisticIndex].imageUrls,
                    isRead: newMsg.is_read,
                    createdAt: newMsg.created_at,
                    isPending: false,
                  };
                  messagesRef.current = updated;
                  return updated;
                }
              }

              const next = [...prev, mapMessage(newMsg, isOwn)];
              messagesRef.current = next;
              return next;
            });
          },
        )

        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (!payload.new) return;
            const updatedMsg = payload.new;

            const target = messagesRef.current.find(
              (m) => m.id === updatedMsg.id || m.realId === updatedMsg.id,
            );
            if (!target || target.isRead === updatedMsg.is_read) return;

            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === updatedMsg.id || m.realId === updatedMsg.id
                  ? { ...m, isRead: updatedMsg.is_read }
                  : m,
              );
              messagesRef.current = next;
              return next;
            });
          },
        )

        .on("broadcast", { event: "typing" }, (payload) => {
          const senderId = payload.payload?.senderId;
          if (String(senderId) === String(myProfileIdRef.current)) return;
          setPartnerTyping(true);
          if (partnerTypingTimeoutRef.current)
            clearTimeout(partnerTypingTimeoutRef.current);
          partnerTypingTimeoutRef.current = setTimeout(
            () => setPartnerTyping(false),
            5000,
          );
        })

        .on("broadcast", { event: "stop_typing" }, (payload) => {
          const senderId = payload.payload?.senderId;
          if (String(senderId) === String(myProfileIdRef.current)) return;
          if (partnerTypingTimeoutRef.current)
            clearTimeout(partnerTypingTimeoutRef.current);
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
      if (partnerTypingTimeoutRef.current)
        clearTimeout(partnerTypingTimeoutRef.current);
      if (channelRef.current) {
        supabaseRealtime.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    roomId,
    myProfileId,
    user,
    authLoading,
    getFreshToken,
    fetchMessages,
    markAsRead,
    stopTyping,
    mapMessage,
  ]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        supabaseRealtime.realtime.setAuth(session.access_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── SEND TEXT ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content) => {
      if (!content?.trim() || !roomId || !user) return;

      stopTyping();
      setSending(true);

      const tempId = `temp-${Date.now()}`;
      // ✅ register ใน pendingMap ก่อน setMessages
      pendingMapRef.current.set(content, tempId);

      setMessages((prev) => {
        const next = [
          ...prev,
          {
            id: tempId,
            content,
            messageType: "text",
            imageUrls: [],
            senderId: myProfileIdRef.current,
            senderName: "Me",
            senderImage: null,
            isOwn: true,
            isPending: true,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];
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
          body: JSON.stringify({ content, messageType: "text" }),
        });
        if (!res.ok) throw new Error("Send failed");
      } catch (err) {
        console.error("❌ Send message error:", err);
        pendingMapRef.current.delete(content);
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== tempId);
          messagesRef.current = next;
          return next;
        });
      } finally {
        setSending(false);
      }
    },
    [roomId, user, getFreshToken, stopTyping],
  );

  // ── SEND IMAGES ───────────────────────────────────────────────
  const sendImages = useCallback(
    async (files) => {
      if (!files?.length || !roomId || !user) return;

      stopTyping();
      setSending(true);

      const previewUrls = files.map((f) => URL.createObjectURL(f));
      const tempId = `temp-${Date.now()}`;
      // ✅ register ใน pendingMap ก่อน setMessages
      pendingMapRef.current.set("@@image", tempId);

      setMessages((prev) => {
        const next = [
          ...prev,
          {
            id: tempId,
            content: "",
            messageType: "image",
            imageUrls: previewUrls,
            senderId: myProfileIdRef.current,
            senderName: "Me",
            senderImage: null,
            isOwn: true,
            isPending: true,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];
        messagesRef.current = next;
        return next;
      });

      try {
        const token = await getFreshToken();
        if (!token) throw new Error("No token");

        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const ext = file.name.split(".").pop();
            const path = `chat/${roomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabaseRealtime.storage
              .from(CHAT_BUCKET)
              .upload(path, file, { contentType: file.type });
            if (error) throw new Error(`Upload failed: ${error.message}`);
            const { data } = supabaseRealtime.storage
              .from(CHAT_BUCKET)
              .getPublicUrl(path);
            return data.publicUrl;
          }),
        );

        previewUrls.forEach((url) => URL.revokeObjectURL(url));

        const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageType: "image",
            imageUrls: uploadedUrls,
            content: "",
          }),
        });
        if (!res.ok) throw new Error("Send failed");
      } catch (err) {
        console.error("❌ Send images error:", err);
        pendingMapRef.current.delete("@@image");
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== tempId);
          messagesRef.current = next;
          return next;
        });
      } finally {
        setSending(false);
      }
    },
    [roomId, user, getFreshToken, stopTyping],
  );

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendImages,
    partnerTyping,
    onInputChange,
  };
}
