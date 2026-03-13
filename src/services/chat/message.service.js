import { messageRepository } from "@/repositories/chat/message.repository";
import { prisma } from "@/lib/prisma";

export const messageService = {
  async getRoomMessages(roomId, myProfileId) {
    // ตรวจสอบสิทธิ์เข้าห้อง
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("ROOM_NOT_FOUND");
    
    const isInRoom = room.profile1_id === myProfileId || room.profile2_id === myProfileId;
    if (!isInRoom) throw new Error("FORBIDDEN");

    const messages = await messageRepository.findMessagesByRoomId(roomId);

    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      messageType: m.message_type,
      imageUrls: m.image_urls ?? [],
      senderId: m.sender_id,
      senderName: m.sender.full_name,
      senderImage: m.sender.images[0]?.image_url ?? null,
      isOwn: m.sender_id === myProfileId,
      isRead: m.is_read,
      createdAt: m.created_at,
    }));
  },

  async sendMessage(roomId, myProfileId, body) {
    const { content, messageType = "text", imageUrls = [] } = body;

    // Validation
    if (messageType === "text" && !content?.trim()) throw new Error("CONTENT_REQUIRED");
    if (messageType === "image" && imageUrls.length === 0) throw new Error("IMAGE_REQUIRED");

    const message = await messageRepository.createMessage({
      roomId,
      senderId: myProfileId,
      content: content?.trim() ?? "",
      messageType,
      imageUrls,
    });

    return {
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
    };
  }
};