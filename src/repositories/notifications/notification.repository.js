import { prisma } from "@/lib/prisma";

/**
 * Repository สำหรับ notifications — อ่าน/อัปเดตตาราง notifications
 */
export const notificationRepository = {
  /**
   * ดึง profile_id จาก user_id (สำหรับหา recipient)
   */
  async findProfileIdByUserId(userId) {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  },

  /**
   * ดึงรายการ noti ของ recipient พร้อม actor (ชื่อ, รูป)
   */
  async findManyByRecipientId(profileId, limit) {
    return await prisma.notification.findMany({
      where: { recipient_id: profileId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            full_name: true,
            images: {
              select: { image_url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
      },
    });
  },

  async existsMatchedByActorAndRecipient(actorId, recipientId) {
    const row = await prisma.notification.findFirst({
      where: {
        actor_id: actorId,
        recipient_id: recipientId,
        type: "MATCHED",
      },
      select: { id: true },
    });

    return Boolean(row);
  },

  async updateSeenByRecipientId(profileId, now) {
    return await prisma.notification.updateMany({
      where: { recipient_id: profileId },
      data: { seen_at: now },
    });
  },

  async updateReadAllByRecipientId(profileId, now) {
    return await prisma.notification.updateMany({
      where: { recipient_id: profileId },
      data: { read_at: now },
    });
  },

  async updateReadById(profileId, notiId, now) {
    return await prisma.notification.updateMany({
      where: {
        id: notiId,
        recipient_id: profileId,
      },
      data: { read_at: now },
    });
  },

  async updateReadByRoomId(profileId, roomId, now) {
    return await prisma.notification.updateMany({
      where: {
        recipient_id: profileId,
        type: "MESSAGE",
        room_id: roomId,
      },
      data: { read_at: now },
    });
  },
};
