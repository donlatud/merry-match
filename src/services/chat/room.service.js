import { roomRepository } from "@/repositories/chat/room.repository";

export const roomService = {
  async getAllRooms(myProfileId) {
    const rooms = await roomRepository.findUserRooms(myProfileId);
    const unreadMap = await roomRepository.getUnreadCounts(rooms.map(r => r.id), myProfileId);

    const formatted = rooms.map((room) => {
      const other = room.profile1_id === myProfileId ? room.profile2 : room.profile1;
      const lastMsg = room.messages[0];
      
      let lastContent = null;
      if (lastMsg) {
        lastContent = lastMsg.message_type === "image" ? "📷 Image" : lastMsg.content;
      }

      return {
        roomId: room.id,
        partnerId: other.id,
        partnerName: other.full_name,
        partnerImage: other.images[0]?.image_url ?? null,
        lastMessage: lastContent,
        lastMessageAt: lastMsg?.created_at ?? room.created_at,
        createdAt: room.created_at,
        myProfileId,
        unreadCount: unreadMap[room.id] ?? 0,
      };
    });

    return formatted.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  },

  async createOrGetRoom(myProfileId, partnerId) {
    return await roomRepository.upsertRoom(myProfileId, partnerId);
  }
};