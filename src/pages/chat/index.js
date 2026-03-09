"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { AuthContext } from "@/contexts/login/AuthContext";
import { supabase } from "@/providers/supabase.provider";
import NavBar from "@/components/NavBar";

export default function ChatListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext); // ใช้ AuthContext
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── ฟังก์ชันดึงรายการห้องแชท ──────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      // ดึง Token สดๆ จาก Supabase Session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      const res = await fetch("/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setRooms(result.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── จัดการกรณีที่ยังโหลด Auth ไม่เสร็จ ────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-utility-bg">
        <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ถ้าไม่ได้ Login ให้กลับหน้า Login
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-utility-bg">
      <header className="shrink-0">
        <NavBar />
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-red-400 border-t-transparent animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <img src="/merry_icon/icon-chat.svg" alt="" className="w-16 h-16 opacity-30" />
            <p className="text-body3">No conversations yet</p>
            <p className="text-body5 text-center">
              Start matching and send a message to your matches!
            </p>
            {/* ปุ่มนำทางไปหน้า Matching */}
            <button 
              onClick={() => router.push("/matchingpage")}
              className="mt-2 text-red-500 font-bold hover:underline"
            >
              Go to Matching
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rooms.map((room, index) => (
              <motion.button
                key={room.roomId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                // เมื่อกดที่ห้องแชท ให้ไปที่หน้ารายละเอียดแชทนั้นๆ
                onClick={() => router.push(`/chat/${room.roomId}`)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-purple-50 transition-colors cursor-pointer w-full text-left shadow-sm group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={room.partnerImage || "/merry_icon/icon-match.svg"}
                    alt={room.partnerName}
                    className="w-14 h-14 rounded-full object-cover border border-gray-100"
                  />
                  {/* แสดงจุดเขียวถ้าออนไลน์ (Optional: ถ้ามี Data) */}
                  {room.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                      {room.partnerName}
                    </p>
                    <p className="text-xs text-gray-400 shrink-0 ml-2">
                      {room.lastMessageAt 
                        ? new Date(room.lastMessageAt).toLocaleDateString("th-TH") 
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 truncate mt-0.5">
                    {room.lastMessage || "Say hello! 👋"}
                  </p>
                </div>

                {/* Arrow Icon */}
                <img
                  src="/merry_icon/icon-chevron-right.svg"
                  alt=""
                  className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}