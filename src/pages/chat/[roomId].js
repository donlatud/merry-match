"use client";

import { useState, useEffect, useRef, useContext } from "react";
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
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
};

function ReadReceipt({ isPending, isRead }) {
  if (isPending)
    return <span className="text-[10px] text-white/40 ml-1">Sending...</span>;
  if (isRead)
    return (
      <span className="text-[10px] text-red-400 ml-1 font-medium">Read</span>
    );
  return <span className="text-[10px] text-white/40 ml-1">Sent</span>;
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
        className="w-8 h-8 rounded-full object-cover shrink-0 border-2 border-white/20 shadow-sm"
      />
      <div className="bg-[#ede9fe] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-purple-400 block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ImageGrid({ urls, isPending, onImageClick }) {
  const count = urls.length;
  return (
    <div
      className={`grid gap-1 rounded-2xl overflow-hidden ${count === 1 ? "grid-cols-1" : "grid-cols-2"} ${isPending ? "opacity-60" : "opacity-100"}`}
      style={{ maxWidth: 240 }}
    >
      {urls.slice(0, 4).map((url, i) => (
        <div
          key={i}
          className={`relative cursor-pointer overflow-hidden bg-gray-800 ${count === 3 && i === 0 ? "col-span-2" : ""}`}
          style={{ aspectRatio: count === 1 ? "4/3" : "1/1" }}
          onClick={() => onImageClick(urls, i)}
        >
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          />
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl leading-none z-10 hover:opacity-70 cursor-pointer"
        onClick={onClose}
      >
        ×
      </button>
      {urls.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white text-3xl z-10 hover:opacity-70 px-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 text-white text-3xl z-10 hover:opacity-70 px-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        </>
      )}
      <motion.img
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        src={urls[current]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {urls.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {urls.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === current ? "bg-white" : "bg-white/40"}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PreviewBar({ files, onRemove, onClear }) {
  return (
    <div className="px-4 py-2 bg-utility-bg border-t border-white/10 flex gap-2 overflow-x-auto">
      {files.map((file, i) => (
        <div key={i} className="relative shrink-0 w-16 h-16">
          <img
            src={URL.createObjectURL(file)}
            alt=""
            className="w-full h-full object-cover rounded-xl border border-white/20"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center leading-none shadow cursor-pointer"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={onClear}
        className="shrink-0 text-xs text-white hover:text-red-400 self-center ml-1 cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}

function ChatPanel({ roomId, partner, myProfileId, router }) {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const fileInputRef = useRef(null);

  const {
    messages,
    loading,
    sending,
    sendMessage,
    sendImages,
    partnerTyping,
    onInputChange,
  } = useRealtimeChat(roomId, myProfileId, partner);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (partnerTyping)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [partnerTyping]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    setSelectedFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (index) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);
    onInputChange(e.target.value);
  };
  const canSend =
    (input.trim().length > 0 || selectedFiles.length > 0) && !sending;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer lg:hidden shrink-0"
        >
          <img
            src="/merry_icon/icon-return.svg"
            alt="Back"
            className="w-5 h-5"
          />
        </button>
        {partner ? (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={partner.image || "/merry_icon/icon-match.svg"}
              alt={partner.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-red-100 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">
                {partner.name}
              </p>
              <AnimatePresence>
                {partnerTyping && (
                  <motion.p
                    key="typing"
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
          <div className="flex items-center gap-3 flex-1 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
            <div className="w-28 h-4 bg-gray-200 rounded" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3"
        style={{
          background: "#160404",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {partner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-187.25 mb-6 shrink-0"
          >
            <div className="flex items-center justify-center gap-6 bg-purple-100 border border-purple-300 rounded-[24px] px-8 py-5 shadow-sm">
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src="/merry_icon/icon-merry-match.svg"
                  alt="Match Icon"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-body5 lg:text-body4 text-red-700 leading-tight">
                  Now you and {partner.name} are Merry Match!
                </p>
                <p className="text-body5 lg:text-body4 text-red-700 leading-snug">
                  You can messege something nice and make a good conversation.
                  Happy Merry!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-white/30">
            <img
              src="/merry_icon/icon-chat.svg"
              alt=""
              className="w-12 h-12 mb-2 opacity-20"
            />
            <p className="text-[14px] font-medium">No messages yet</p>
            <p className="text-[12px]">Say hello to your match! 👋</p>
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
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                  />
                )}
                <div
                  className={`flex flex-col gap-1 max-w-[72%] ${msg.isOwn ? "items-end" : "items-start"}`}
                >
                  {msg.messageType === "image" && msg.imageUrls?.length > 0 ? (
                    <ImageGrid
                      urls={msg.imageUrls}
                      isPending={msg.isPending}
                      onImageClick={(urls, index) =>
                        setLightbox({ urls, index })
                      }
                    />
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-body2 leading-relaxed transition-opacity duration-200 ${
                        msg.isOwn
                          ? "bg-[#7d2262] text-white rounded-br-sm"
                          : "bg-[#efc4e2] text-gray-900 rounded-bl-sm"
                      } ${msg.isPending ? "opacity-50" : "opacity-100"}`}
                    >
                      {msg.content}
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-1">
                    <p className="text-[10px] text-white/80">
                      {formatTime(msg.createdAt)}
                    </p>
                    {msg.isOwn && (
                      <ReadReceipt
                        isPending={msg.isPending}
                        isRead={msg.isRead}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {partnerTyping && (
              <TypingIndicator
                key="typing-indicator"
                partnerImage={partner?.image}
              />
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <PreviewBar
              files={selectedFiles}
              onRemove={removeFile}
              onClear={() => setSelectedFiles([])}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div
        className="px-4 py-3 border-t border-white/10 flex items-end gap-3 shrink-0"
        style={{ background: "#160404" }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= MAX_FILES || sending}
          className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0 transition-all cursor-pointer"
        >
          <img
            src="/merry_icon/icon-image.svg"
            alt="Upload Image"
            className="w-6 h-6 object-contain"
          />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedFiles.length > 0 ? "Add a caption..." : "Messege here..."
          }
          rows={1}
          className="flex-1 resize-none px-5 py-3 text-[14px] text-white placeholder:text-gray-500 focus:outline-none transition-all max-h-32 bg-utility-bg"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${canSend ? "bg-red-500 hover:bg-red-600 cursor-pointer" : "cursor-not-allowed"}`}
        >
          <img
            src="/merry_icon/icon-send.svg"
            alt="Send"
            className={`w-6 h-6 object-contain transition-all ${canSend ? "brightness-0 invert" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence>
        {lightbox && (
          <Lightbox
            urls={lightbox.urls}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatRoomPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { user, loading: authLoading } = useContext(AuthContext);

  const [myProfileId, setMyProfileId] = useState(null);
  const myProfileIdRef = useRef(null); // ✅ เก็บไว้ไม่ให้ reset ตอนเปลี่ยน room
  const [partner, setPartner] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const refetchRoomsRef = useRef(null);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!roomId || authLoading || !user) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
            myProfileIdRef.current = room.myProfileId; // ✅ เก็บใน ref
          }
        }
      } catch (error) {
        console.error("Failed to fetch room info:", error);
      }
    };
    fetchRoomInfo();
  }, [roomId, authLoading, user]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!myProfileId) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "#160404" }}
      >
        <div className="w-10 h-10 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  // ✅ ใช้ ref เป็น fallback — ไม่ให้ spinner โชว์ตอนเปลี่ยน room
  const resolvedProfileId = myProfileId ?? myProfileIdRef.current;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <header className="shrink-0">
        <NavBar />
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden w-full max-w-360 mx-auto">
        <aside className="hidden lg:flex w-80 shrink-0 border-r border-gray-100 bg-white flex-col overflow-hidden px-6 py-6">
          <LeftSidebar
            currentProfileId={resolvedProfileId}
            currentRoomId={roomId}
            matches={matches}
            loading={matchesLoading}
            onRefetchRooms={(fn) => {
              refetchRoomsRef.current = fn;
            }}
          />
        </aside>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {resolvedProfileId ? (
            <ChatPanel
              roomId={roomId}
              partner={partner}
              myProfileId={resolvedProfileId}
              router={router}
            />
          ) : (
            <div
              className="flex flex-1 items-center justify-center"
              style={{ background: "#160404" }}
            >
              <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
