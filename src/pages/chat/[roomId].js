"use client";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import NavBar from "@/components/NavBar";
import LeftSidebar from "@/components/matching/LeftSidebar";
import { useRealtimeChat } from "@/hooks/chat/useRealtimeChat";

const MAX_FILES = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const formatTime = (createdAt) => {
  const dateStr = String(createdAt).endsWith("Z") ? createdAt : createdAt + "Z";
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  });
};

function ReadReceipt({ isPending, isRead }) {
  if (isPending) return <span className="text-[10px] text-gray-300 ml-1">Sending...</span>;
  if (isRead) return <span className="text-[10px] text-red-400 ml-1 font-medium">Read</span>;
  return <span className="text-[10px] text-gray-400 ml-1">Sent</span>;
}

function TypingIndicator({ partnerImage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
      className="flex items-end gap-2"
    >
      <img src={partnerImage || "/merry_icon/icon-match.svg"} alt=""
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm" />
      <div className="bg-white border border-gray-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </motion.div>
  );
}

function ImageGrid({ urls, isPending, onImageClick }) {
  const count = urls.length;
  return (
    <div className={`grid gap-1 rounded-2xl overflow-hidden ${
      count === 1 ? "grid-cols-1" :
      count === 2 ? "grid-cols-2" :
      count >= 3 ? "grid-cols-2" : ""
    } ${isPending ? "opacity-60" : "opacity-100"}`}
      style={{ maxWidth: 240 }}
    >
      {urls.slice(0, 4).map((url, i) => (
        <div key={i}
          className={`relative cursor-pointer overflow-hidden bg-gray-100 ${
            count === 3 && i === 0 ? "col-span-2" : ""
          }`}
          style={{ aspectRatio: count === 1 ? "4/3" : "1/1" }}
          onClick={() => onImageClick(urls, i)}
        >
          <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
          {i === 3 && count > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">+{count - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Lightbox({ urls, initialIndex, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const prev = () => setCurrent((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setCurrent((i) => (i + 1) % urls.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white text-3xl leading-none z-10 hover:opacity-70" onClick={onClose}>×</button>
      {urls.length > 1 && (
        <>
          <button className="absolute left-4 text-white text-3xl z-10 hover:opacity-70 px-2"
            onClick={(e) => { e.stopPropagation(); prev(); }}>‹</button>
          <button className="absolute right-4 text-white text-3xl z-10 hover:opacity-70 px-2"
            onClick={(e) => { e.stopPropagation(); next(); }}>›</button>
        </>
      )}
      <motion.img key={current} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }} src={urls[current]} alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()} />
      {urls.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {urls.map((_, i) => (
            <button key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white" : "bg-white/40"}`}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PreviewBar({ files, onRemove, onClear }) {
  return (
    <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto">
      {files.map((file, i) => (
        <div key={i} className="relative shrink-0 w-16 h-16">
          <img src={URL.createObjectURL(file)} alt=""
            className="w-full h-full object-cover rounded-xl border border-gray-200" />
          <button onClick={() => onRemove(i)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full text-white text-xs flex items-center justify-center leading-none shadow">×</button>
        </div>
      ))}
      <button onClick={onClear} className="shrink-0 text-xs text-gray-400 hover:text-red-400 self-center ml-1">
        Clear all
      </button>
    </div>
  );
}

// ── ChatPanel — แยกออกมาเพื่อให้ LeftSidebar กับ chat อยู่ด้วยกัน ──
function ChatPanel({ roomId, partner, myProfileId, router }) {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const fileInputRef = useRef(null);

  const { messages, loading, sending, sendMessage, sendImages, partnerTyping, onInputChange } =
    useRealtimeChat(roomId, myProfileId, partner);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (partnerTyping) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [partnerTyping]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const combined = [...selectedFiles, ...valid].slice(0, MAX_FILES);
    setSelectedFiles(combined);
    e.target.value = "";
  };

  const removeFile = (index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (selectedFiles.length > 0) {
      const files = [...selectedFiles];
      setSelectedFiles([]);
      if (input.trim()) {
        const text = input;
        setInput("");
        onInputChange("");
        await sendMessage(text);
      }
      await sendImages(files);
    } else if (input.trim()) {
      const text = input;
      setInput("");
      onInputChange("");
      await sendMessage(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    onInputChange(value);
  };

  const canSend = (input.trim().length > 0 || selectedFiles.length > 0) && !sending;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm shrink-0">
        {/* ✅ ปุ่ม back อยู่แถวเดียวกับ partner — mobile only */}
        <button onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer lg:hidden shrink-0">
          <img src="/merry_icon/icon-return.svg" alt="Back" className="w-5 h-5" />
        </button>
        {partner ? (
          <div className="flex items-center gap-3 flex-1">
            <img src={partner.image || "/merry_icon/icon-match.svg"} alt={partner.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-100" />
            <div>
              <p className="font-bold text-gray-900 leading-tight">{partner.name}</p>
              <AnimatePresence>
                {partnerTyping && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="text-[11px] text-red-400 font-medium">
                    typing...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {/* ✅ Match announcement banner — แสดงตลอดเวลาด้านบนสุด */}
        {partner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mx-auto w-full max-w-md shrink-0"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <img src="/merry_icon/icon-match.svg" alt="" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-red-500 leading-snug">
                Now you and {partner.name} are Merry Match!
              </p>
              <p className="text-[11px] text-red-400 mt-0.5 leading-snug">
                You can message something nice and make a good conversation. Happy Merry!
              </p>
            </div>
          </motion.div>
        )}
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
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`flex items-end gap-2 ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                {!msg.isOwn && (
                  <img src={msg.senderImage || "/merry_icon/icon-match.svg"} alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm" />
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                  {msg.messageType === "image" && msg.imageUrls?.length > 0 ? (
                    <ImageGrid urls={msg.imageUrls} isPending={msg.isPending}
                      onImageClick={(urls, index) => setLightbox({ urls, index })} />
                  ) : (
                    <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm leading-relaxed transition-opacity duration-200 ${
                      msg.isOwn
                        ? "bg-red-400 text-white rounded-br-sm shadow-red-200"
                        : "bg-white text-gray-900 rounded-bl-sm border border-gray-50"
                    } ${msg.isPending ? "opacity-60" : "opacity-100"}`}>
                      {msg.content}
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-1">
                    <p className="text-[10px] text-gray-400 font-medium">{formatTime(msg.createdAt)}</p>
                    {msg.isOwn && <ReadReceipt isPending={msg.isPending} isRead={msg.isRead} />}
                  </div>
                </div>
              </motion.div>
            ))}
            {partnerTyping && <TypingIndicator key="typing-indicator" partnerImage={partner?.image} />}
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Preview Bar */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
            <PreviewBar files={selectedFiles} onRemove={removeFile} onClear={() => setSelectedFiles([])} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="px-4 py-4 bg-white border-t flex items-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <button onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= MAX_FILES || sending}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors cursor-pointer">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(",")}
          multiple className="hidden" onChange={handleFileChange} />
        <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
          placeholder={selectedFiles.length > 0 ? "Add a caption... (optional)" : "Message here..."}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[15px] focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 transition-all max-h-32 bg-gray-50"
          style={{ lineHeight: "1.4" }} />
        <button onClick={handleSend} disabled={!canSend}
          className="w-12 h-12 rounded-full bg-red-400 hover:bg-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md shadow-red-100 active:scale-95">
          {sending ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <img src="/merry_icon/icon-send.svg" alt="Send" className="w-5 h-5 translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox urls={lightbox.urls} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function ChatRoomPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user, loading: authLoading } = useContext(AuthContext);

  const [myProfileId, setMyProfileId] = useState(null);
  const [partner, setPartner] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const refetchRoomsRef = useRef(null);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!roomId || authLoading || !user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/chat/rooms", { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) {
          const room = result.data.find((r) => r.roomId === roomId);
          if (room) {
            setPartner({ name: room.partnerName, image: room.partnerImage });
            setMyProfileId(room.myProfileId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch room info:", error);
      }
    };
    fetchRoomInfo();
  }, [roomId, authLoading, user]);

  // ✅ fetch matches เหมือน MatchingPage
  useEffect(() => {
    const fetchMatches = async () => {
      if (!myProfileId) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/matching/matches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setMatches(result.data);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setMatchesLoading(false);
      }
    };
    fetchMatches();
  }, [myProfileId]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-utility-bg">
        <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) { router.push("/login"); return null; }

  return (
    <div className="h-screen flex flex-col bg-utility-bg overflow-hidden">
      <header className="shrink-0"><NavBar /></header>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LeftSidebar — desktop only ── */}
        <aside className="hidden lg:flex w-80 shrink-0 border-r bg-white flex-col overflow-hidden px-6 py-6">
          <LeftSidebar
            currentProfileId={myProfileId}
            matches={matches}
            loading={matchesLoading}
            onRefetchRooms={(fn) => { refetchRoomsRef.current = fn; }}
          />
        </aside>

        {/* ── Chat area ── */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* ChatPanel — mount เมื่อ myProfileId พร้อม */}
          {myProfileId ? (
            <ChatPanel key={roomId} roomId={roomId} partner={partner} myProfileId={myProfileId} router={router} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}