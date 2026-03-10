// src/pages/api/chat/rooms.js
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const myProfile = await prisma.profile.findUnique({ where: { user_id: user.id } });
  if (!myProfile) return res.status(404).json({ error: "Profile not found" });

  // ── GET ───────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const rooms = await prisma.chatRoom.findMany({
        where: {
          OR: [
            { profile1_id: myProfile.id },
            { profile2_id: myProfile.id },
          ],
        },
        include: {
          profile1: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
          profile2: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
          messages: { orderBy: { created_at: "desc" }, take: 1 },
        },
      });

      // ✅ นับ unread ทุก room ใน query เดียว
      const unreadCounts = await prisma.message.groupBy({
        by: ["room_id"],
        where: {
          room_id: { in: rooms.map((r) => r.id) },
          sender_id: { not: myProfile.id },
          is_read: false,
        },
        _count: { id: true },
      });

      const unreadMap = Object.fromEntries(
        unreadCounts.map((u) => [u.room_id, u._count.id])
      );

      const formatted = rooms.map((room) => {
        const other = room.profile1_id === myProfile.id ? room.profile2 : room.profile1;
        const lastMsg = room.messages[0];
        // ✅ แสดง lastMessage ให้ถูกต้องทั้ง text และ image
        let lastMessage = null;
        if (lastMsg) {
          if (lastMsg.message_type === "image") lastMessage = "📷 Image";
          else lastMessage = lastMsg.content || null;
        }
        return {
          roomId: room.id,
          partnerId: other.id,
          partnerName: other.full_name,
          partnerImage: other.images[0]?.image_url ?? null,
          lastMessage,
          lastMessageAt: lastMsg?.created_at ?? room.created_at,
          createdAt: room.created_at,
          myProfileId: myProfile.id,
          unreadCount: unreadMap[room.id] ?? 0, // ✅
        };
      });

      // ✅ เรียงตาม lastMessageAt ล่าสุดก่อน
      formatted.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      console.error("[GET /api/chat/rooms]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ── POST ──────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { partnerId } = req.body;
      if (!partnerId) return res.status(400).json({ error: "partnerId is required" });

      const [p1, p2] = [myProfile.id, partnerId].sort();
      const room = await prisma.chatRoom.upsert({
        where: { profile1_id_profile2_id: { profile1_id: p1, profile2_id: p2 } },
        update: {},
        create: { profile1_id: p1, profile2_id: p2 },
      });

      return res.status(200).json({ success: true, data: room });
    } catch (error) {
      console.error("[POST /api/chat/rooms]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}