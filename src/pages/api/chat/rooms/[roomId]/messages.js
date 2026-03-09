// src/pages/api/chat/rooms/[roomId]/messages.js
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  const { roomId } = req.query;

  // ── [1] AUTH ──────────────────────────────────────────────────
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const myProfile = await prisma.profile.findUnique({
    where: { user_id: user.id },
  });
  if (!myProfile) return res.status(404).json({ error: "Profile not found" });

  // ── [2] ตรวจสอบว่า user อยู่ใน room นี้จริง ──────────────────
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });

  const isInRoom =
    room.profile1_id === myProfile.id || room.profile2_id === myProfile.id;
  if (!isInRoom) return res.status(403).json({ error: "Forbidden" });

  // ── GET — ดึง messages ────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { cursor, limit = 30 } = req.query;

      const messages = await prisma.message.findMany({
        where: { room_id: roomId },
        include: {
          sender: {
            include: { images: { orderBy: { order: "asc" }, take: 1 } },
          },
        },
        orderBy: { created_at: "asc" },
        take: Number(limit),
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      // mark as read — message ที่ไม่ใช่ของเรา
      await prisma.message.updateMany({
        where: {
          room_id: roomId,
          sender_id: { not: myProfile.id },
          is_read: false,
        },
        data: { is_read: true },
      });

      const formatted = messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        senderName: m.sender.full_name,
        senderImage: m.sender.images[0]?.image_url ?? null,
        isOwn: m.sender_id === myProfile.id,
        isRead: m.is_read,
        createdAt: m.created_at,
      }));

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      console.error("[GET /api/chat/rooms/[roomId]/messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ── POST — ส่ง message ────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

      const message = await prisma.message.create({
        data: {
          room_id: roomId,
          sender_id: myProfile.id,
          content: content.trim(),
        },
        include: {
          sender: {
            include: { images: { orderBy: { order: "asc" }, take: 1 } },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: message.id,
          content: message.content,
          senderId: message.sender_id,
          senderName: message.sender.full_name,
          senderImage: message.sender.images[0]?.image_url ?? null,
          isOwn: true,
          isRead: false,
          createdAt: message.created_at,
        },
      });
    } catch (error) {
      console.error("[POST /api/chat/rooms/[roomId]/messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ── PATCH — mark messages as read ────────────────────────────
  // เรียกเมื่อ partner เปิดห้องแชทหรือ scroll มาเห็น message
  if (req.method === "PATCH") {
    try {
      await prisma.message.updateMany({
        where: {
          room_id: roomId,
          sender_id: { not: myProfile.id }, // mark เฉพาะ message ของอีกฝ่าย
          is_read: false,
        },
        data: { is_read: true },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[PATCH /api/chat/rooms/[roomId]/messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}