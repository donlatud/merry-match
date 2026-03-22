"use client";
// components/matching/MerryMatchModal.jsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import { supabase } from "@/providers/supabase.provider";

export default function MerryMatchModal({ open, onClose, matchedProfile }) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose(), 10000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  const handleStartConversation = useCallback(async () => {
    if (!matchedProfile?.id) return;
    setNavigating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerId: matchedProfile.id }),
      });
      const result = await res.json();
      if (result.success) {
        onClose();
        router.push(`/chat/${result.data.id}`);
      }
    } catch (err) {
      console.error("Failed to open chat room:", err);
    } finally {
      setNavigating(false);
    }
  }, [matchedProfile?.id, onClose, router]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent
        className="p-0! border-0 bg-transparent shadow-none w-[calc(100vw-32px)] sm:w-97.5 max-w-97.5 [&>button]:hidden rounded-3xl overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Merry Match!</DialogTitle>
        <DialogDescription className="sr-only">
          You and {matchedProfile?.name ?? "someone"} liked each other
        </DialogDescription>

        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="modal-content"
              className="relative w-full overflow-hidden"
              style={{ height: "580px" }}
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
                mass: 0.8,
              }}
            >
              {/* รูปพื้นหลัง */}
              <img
                src={matchedProfile?.image ?? "/merry_icon/icon-match.svg"}
                alt={matchedProfile?.name ?? "Match"}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-[rgba(116,33,56,0.9)] via-[rgba(116,33,56,0.15)] to-transparent" />

              {/* particle hearts */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-xl select-none pointer-events-none"
                  style={{ left: `${12 + i * 15}%`, bottom: "35%" }}
                  initial={{ y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    y: -(100 + i * 25),
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.6],
                  }}
                  transition={{
                    delay: 0.4 + i * 0.1,
                    duration: 1.4,
                    ease: "easeOut",
                  }}
                >
                  ❤️
                </motion.div>
              ))}

              {/* เนื้อหา */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-8 gap-3 w-full">
                <motion.img
                  src="/merry_icon/icon-match.svg"
                  alt=""
                  className="w-16 h-16 drop-shadow-lg"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.25,
                    type: "spring",
                    stiffness: 380,
                    damping: 14,
                  }}
                />

                <motion.h2
                  className="text-4xl font-sans text-white tracking-wide text-center"
                  style={{ textShadow: "0 2px 20px rgba(236,72,153,0.7)" }}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.38, duration: 0.45, ease: "easeOut" }}
                >
                  Merry Match!
                </motion.h2>

                {matchedProfile?.name && (
                  <motion.p
                    className="text-white/80 text-base font-medium -mt-1 text-center"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.48, duration: 0.4, ease: "easeOut" }}
                  >
                    You and {matchedProfile.name} liked each other
                  </motion.p>
                )}

                {/* ✅ Start Conversation — navigate ไปหน้า chat */}
                <motion.button
                  onClick={handleStartConversation}
                  disabled={navigating}
                  className="mt-1 px-8 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 text-white font-semibold text-base hover:bg-white/35 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.58, duration: 0.4, ease: "easeOut" }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {navigating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : null}
                  Start Conversation
                </motion.button>

                <motion.button
                  onClick={onClose}
                  className="text-white/55 text-sm font-medium hover:text-white/85 transition-colors cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  Keep swiping
                </motion.button>

                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
