"use client";
// components/matching/LeftSidebar.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// ── animation variants ────────────────────────────────────────
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

export default function LeftSidebar({
  currentProfileId,
  matches = [],
  loading,
}) {
  return (
    <motion.div
      className="flex flex-col gap-6 h-full w-full overflow-hidden"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Discover New Match ── */}
      <motion.div
        variants={sectionVariants}
        className="shrink-0 border-2 border-purple-500 rounded-3xl p-6 flex flex-col items-center text-center gap-3 bg-gray-100 shadow-sm"
        // pulse border loop
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(168,85,247,0)",
            "0 0 0 6px rgba(168,85,247,0.15)",
            "0 0 0 0 rgba(168,85,247,0)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="p-3 rounded-2xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/merry_icon/icon-search-love.svg"
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
      </motion.div>

      <motion.hr
        variants={sectionVariants}
        className="shrink-0 border-gray-100"
      />

      {/* ── Merry Match — scroll แนวนอน ── */}
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
                    // pop in พร้อม bounce stagger
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
                  >
                    <img
                      src={match.image || "/merry_icon/icon-match.svg"}
                      alt={match.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-transparent group-hover:border-red-300 transition-colors shadow-sm"
                    />
                    {/* heart badge pop in */}
                    <motion.img
                      src="/merry_icon/icon-match.svg"
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
                    {/* pulse ring สำหรับ match ใหม่ */}
                    {index < 3 && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-red-400 pointer-events-none"
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                      />
                    )}
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

      {/* ── Chat — scroll แนวตั้ง ── */}
      <motion.div
        variants={sectionVariants}
        className="flex flex-col gap-4 flex-1 min-h-0"
      >
        <h4 className="shrink-0 text-body2 font-bold text-gray-900 px-1">
          Chat with Merry Match
        </h4>

        <div className="overflow-y-auto flex-1 flex flex-col gap-2 -mx-2 px-2 pb-4 [&::-webkit-scrollbar]:hidden">
          <AnimatePresence mode="popLayout">
            {matches.map((match, index) => (
              <motion.button
                key={`chat-${match.matchId}`}
                layout
                // slide in จากซ้าย stagger
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.06,
                }}
                className="relative flex items-center gap-3 rounded-2xl p-3 cursor-pointer w-full text-left group shrink-0 overflow-hidden"
              >
                {/* hover background slide in จากซ้าย */}
                <motion.div
                  className="absolute inset-0 bg-red-50 rounded-2xl"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <img
                  src={match.image}
                  alt={match.name}
                  className="relative z-10 w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm"
                />
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-body4 font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate">
                      {match.name}
                    </p>
                  </div>
                  <p className="text-[12px] text-gray-400 truncate">
                    Matched {match.matchedAtFormatted}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
