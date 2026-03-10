// src/pages/api/chat/rooms/[roomId]/messages.js
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  const { roomId } = req.query;

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const myProfile = await prisma.profile.findUnique({ where: { user_id: user.id } });
  if (!myProfile) return res.status(404).json({ error: "Profile not found" });

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return res.status(404).json({ error: "Room not found" });

  const isInRoom = room.profile1_id === myProfile.id || room.profile2_id === myProfile.id;
  if (!isInRoom) return res.status(403).json({ error: "Forbidden" });

  // ── GET ───────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const messages = await prisma.message.findMany({
        where: { room_id: roomId },
        include: {
          sender: {
            include: { images: { orderBy: { order: "asc" }, take: 1 } },
          },
        },
        orderBy: { created_at: "asc" },
      });

      // ✅ ลบ updateMany ออกจาก GET — ไม่ auto mark as read
      // การ mark as read ทำผ่าน PATCH เท่านั้น (เรียกตอน user เปิดห้องจริงๆ)

      const formatted = messages.map((m) => ({
        id: m.id,
        content: m.content,
        messageType: m.message_type,
        imageUrls: m.image_urls ?? [],
        senderId: m.sender_id,
        senderName: m.sender.full_name,
        senderImage: m.sender.images[0]?.image_url ?? null,
        isOwn: m.sender_id === myProfile.id,
        isRead: m.is_read,
        createdAt: m.created_at,
      }));

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      console.error("[GET messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ── POST ──────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { content, messageType = "text", imageUrls = [] } = req.body;

      if (messageType === "text" && !content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      if (messageType === "image" && imageUrls.length === 0) {
        return res.status(400).json({ error: "imageUrls is required" });
      }

      const message = await prisma.message.create({
        data: {
          room_id: roomId,
          sender_id: myProfile.id,
          content: content?.trim() ?? "",
          message_type: messageType,
          image_urls: imageUrls,
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
          messageType: message.message_type,
          imageUrls: message.image_urls ?? [],
          senderId: message.sender_id,
          senderName: message.sender.full_name,
          senderImage: message.sender.images[0]?.image_url ?? null,
          isOwn: true,
          isRead: false,
          createdAt: message.created_at,
        },
      });
    } catch (error) {
      console.error("[POST messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ── PATCH: mark as read ───────────────────────────────────────
  // ✅ เรียกเฉพาะตอน user เปิดห้องแชทจริงๆ
  if (req.method === "PATCH") {
    try {
      await prisma.message.updateMany({
        where: {
          room_id: roomId,
          sender_id: { not: myProfile.id },
          is_read: false,
        },
        data: { is_read: true },
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[PATCH messages]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}