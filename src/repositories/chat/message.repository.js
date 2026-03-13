import { prisma } from "@/lib/prisma";

export const messageRepository = {
  async findMessagesByRoomId(roomId) {
    return await prisma.message.findMany({
      where: { room_id: roomId },
      include: {
        sender: {
          include: { images: { orderBy: { order: "asc" }, take: 1 } },
        },
      },
      orderBy: { created_at: "asc" },
    });
  },

  async createMessage(data) {
    return await prisma.message.create({
      data: {
        room_id: data.roomId,
        sender_id: data.senderId,
        content: data.content,
        message_type: data.messageType,
        image_urls: data.imageUrls,
      },
      include: {
        sender: {
          include: { images: { orderBy: { order: "asc" }, take: 1 } },
        },
      },
    });
  },

  async markAsRead(roomId, myProfileId) {
    return await prisma.message.updateMany({
      where: {
        room_id: roomId,
        sender_id: { not: myProfileId },
        is_read: false,
      },
      data: { is_read: true },
    });
  }
};