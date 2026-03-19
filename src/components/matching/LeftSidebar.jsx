"use client";
// components/matching/LeftSidebar.jsx
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeChatList } from "@/hooks/chat/useRealtimeChatList";
import { useEffect } from "react";

const sidebarVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const formatLastMessageAt = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(String(dateStr).endsWith("Z") ? dateStr : dateStr + "Z");
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday)
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  return  d.toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok" });
};

export default function LeftSidebar({
  currentProfileId,
  currentRoomId,
  matches = [],
  loading,
  onRefetchRooms,
}) {
  const router = useRouter();
  const activeRoomId = currentRoomId ?? null;
  const {
    rooms,
    loading: roomsLoading,
    markRoomAsRead,
    refetchRooms,
  } = useRealtimeChatList();

  useEffect(() => {
    if (onRefetchRooms) onRefetchRooms(refetchRooms);
  }, [refetchRooms]);

  // ✅ function เดียวใช้ได้ทั้ง match avatar และ chat list
  const handleOpenChat = (partnerId) => {
    const room = rooms.find((r) => r.partnerId === partnerId);
    if (room) {
      markRoomAsRead(room.roomId);
      router.push(`/chat/${room.roomId}`);
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-6 h-full w-full overflow-hidden"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Discover New Match — motion.button กดได้แน่นอน ── */}
      <motion.button
        variants={sectionVariants}
        className="shrink-0 border-2 border-purple-500 rounded-3xl p-6 flex flex-col items-center text-center gap-3 bg-gray-100 shadow-sm cursor-pointer hover:bg-gray-200 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(168,85,247,0)",
            "0 0 0 6px rgba(168,85,247,0.15)",
            "0 0 0 0 rgba(168,85,247,0)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => router.push("/matchingpage")}
      >
        <motion.div
          className="p-3 rounded-2xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/merry_icon/icon-search-match.svg"
            alt=""
            className="w-10 h-10"
          />
        </motion.div>
        <h4 className="text-body2 font-bold text-red-500">
          Discover New Match
        </h4>
        <span className="text-body5">
          Start find and Merry to get know and connect with new friend!
        </span>
      </motion.button>

      <motion.hr
        variants={sectionVariants}
        className="shrink-0 border-gray-100"
      />

      {/* ── Merry Match ── */}
      <motion.div
        variants={sectionVariants}
        className="shrink-0 flex flex-col gap-4"
      >
        <h4 className="text-body2 font-bold text-gray-900 px-1">
          Merry Match!{" "}
          <span className="text-red-400 ml-1">{matches.length}</span>
        </h4>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden py-3">
          <div className="flex gap-4 w-max px-2">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-16 h-16 rounded-2xl bg-gray-200 shrink-0"
                  />
                ))
            ) : (
              <AnimatePresence mode="popLayout">
                {matches.map((match, index) => (
                  <motion.button
                    key={match.matchId}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      delay: index * 0.05,
                    }}
                    whileHover={{ y: -4, scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => handleOpenChat(match.profileId)}
                  >
                    <img
                      src={match.image || "/merry_icon/icon-match-status.svg"}
                      alt={match.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-transparent group-hover:border-red-300 transition-colors shadow-sm"
                    />
                    <motion.img
                      src="/merry_icon/icon-match-status.svg"
                      alt=""
                      className="absolute -bottom-2 -right-2 w-7 h-7 drop-shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: index * 0.05 + 0.2,
                        type: "spring",
                        stiffness: 600,
                      }}
                    />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      <motion.hr
        variants={sectionVariants}
        className="shrink-0 border-gray-100"
      />

      {/* ── Chat Rooms ── */}
      <motion.div
        variants={sectionVariants}
        className="flex flex-col gap-4 flex-1 min-h-0"
      >
        <h4 className="shrink-0 text-body2 font-bold text-gray-900 px-1">
          Chat with Merry Match
        </h4>
        <div className="overflow-y-auto flex-1 flex flex-col gap-2 -mx-2 px-2 pb-4 [&::-webkit-scrollbar]:hidden">
          {roomsLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <Skeleton className="w-24 h-3 bg-gray-200 rounded" />
                    <Skeleton className="w-32 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
          ) : rooms.length === 0 ? (
            <p className="text-body5 text-gray-400 text-center py-4">
              No conversations yet
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {rooms.map((room, index) => (
                <motion.button
                  key={room.roomId}
                  layout
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    delay: index * 0.06,
                  }}
                  onClick={() => handleOpenChat(room.partnerId)}
                  className={`relative flex items-center gap-3 rounded-2xl p-3 cursor-pointer w-full text-left group shrink-0 overflow-hidden border-2 transition-colors ${
                    room.roomId === activeRoomId
                      ? "border-purple-500 bg-gray-100"
                      : "border-transparent"
                  }`}
                >
                  <motion.div
                    className="absolute inset-0 bg-red-50 rounded-2xl"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="relative z-10 shrink-0">
                    <img
                      src={
                        room.partnerImage || "/merry_icon/icon-match-status.svg"
                      }
                      alt={room.partnerName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
                    />
                    {room.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {room.unreadCount > 9 ? "9+" : room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-body2 font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate">
                        {room.partnerName}
                      </p>
                      <p className="text-body4 text-gray-700 shrink-0">
                        {formatLastMessageAt(room.lastMessageAt)}
                      </p>
                    </div>
                    <p
                      className={`text-body4 truncate mt-0.5 ${room.unreadCount > 0 ? "text-gray-700 font-semibold" : "text-gray-700"}`}
                    >
                      {room.lastMessage || "Say hello! 👋"}
                    </p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
