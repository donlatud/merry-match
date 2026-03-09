"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import NavBar from "@/components/NavBar";
import { useRealtimeChat } from "@/hooks/chat/useRealtimeChat";

const formatTime = (createdAt) => {
  const dateStr = String(createdAt).endsWith("Z") ? createdAt : createdAt + "Z";
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
};

function ReadReceipt({ isPending, isRead }) {
  if (isPending) return <span className="text-[10px] text-gray-300 ml-1">○</span>;
  if (isRead) return <span className="text-[10px] text-red-400 ml-1 font-bold">✓✓</span>;
  return <span className="text-[10px] text-gray-400 ml-1">✓</span>;
}

function TypingIndicator({ partnerImage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="flex items-end gap-2"
    >
      <img
        src={partnerImage || "/merry_icon/icon-match.svg"}
        alt=""
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm"
      />
      <div className="bg-white border border-gray-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatRoomPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user, loading: authLoading } = useContext(AuthContext);
  const [myProfileId, setMyProfileId] = useState(null);
  const [input, setInput] = useState("");
  const [partner, setPartner] = useState(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  const { messages, loading, sending, sendMessage, partnerTyping, onInputChange } =
    useRealtimeChat(roomId, myProfileId, partner);

  useEffect(() => {
    const fetchPartnerInfo = async () => {
      if (!roomId || authLoading || !user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/chat/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          const room = result.data.find((r) => r.roomId === roomId);
          if (room) {
            setPartner({ name: room.partnerName, image: room.partnerImage });
            setMyProfileId(room.myProfileId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch partner info:", error);
      }
    };
    fetchPartnerInfo();
  }, [roomId, authLoading, user]);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (partnerTyping) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [partnerTyping]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    // ✅ แจ้ง hook ว่า input ว่างแล้ว → hook จะ stopTyping เอง
    onInputChange("");
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    // ✅ delegate ให้ hook จัดการทั้งหมด
    onInputChange(value);
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-utility-bg">
        <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-utility-bg overflow-hidden">
      <header className="shrink-0">
        <NavBar />
      </header>

      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <img src="/merry_icon/icon-chevron-left.svg" alt="Back" className="w-5 h-5" />
        </button>

        {partner ? (
          <div className="flex items-center gap-3">
            <img
              src={partner.image || "/merry_icon/icon-match.svg"}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
            />
            <div>
              <p className="font-bold text-gray-900 leading-tight">{partner.name}</p>
              <AnimatePresence>
                {partnerTyping && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-red-400 font-medium"
                  >
                    typing...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400 opacity-60">
            <img src="/merry_icon/icon-chat.svg" alt="" className="w-12 h-12 mb-2" />
            <p className="text-body4 font-medium">No messages yet</p>
            <p className="text-body5">Say hello to your match! 👋</p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="sync">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`flex items-end gap-2 ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                {!msg.isOwn && (
                  <img
                    src={msg.senderImage || "/merry_icon/icon-match.svg"}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm"
                  />
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm leading-relaxed transition-opacity duration-200 ${
                      msg.isOwn
                        ? "bg-red-400 text-white rounded-br-sm shadow-red-200"
                        : "bg-white text-gray-900 rounded-bl-sm border border-gray-50"
                    } ${msg.isPending ? "opacity-60" : "opacity-100"}`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <p className="text-[10px] text-gray-400 font-medium">
                      {formatTime(msg.createdAt)}
                    </p>
                    {msg.isOwn && (
                      <ReadReceipt isPending={msg.isPending} isRead={msg.isRead} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {partnerTyping && (
              <TypingIndicator key="typing-indicator" partnerImage={partner?.image} />
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <div className="px-4 py-4 bg-white border-t flex items-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[15px] focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 transition-all max-h-32 bg-gray-50"
          style={{ lineHeight: "1.4" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-12 h-12 rounded-full bg-red-400 hover:bg-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md shadow-red-100 active:scale-95"
        >
          {sending ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <img src="/merry_icon/icon-send.svg" alt="Send" className="w-5 h-5 translate-x-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}