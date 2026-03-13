import { prisma } from "@/lib/prisma";

export const roomRepository = {
  async findUserRooms(profileId) {
    return await prisma.chatRoom.findMany({
      where: {
        OR: [{ profile1_id: profileId }, { profile2_id: profileId }],
      },
      include: {
        profile1: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
        profile2: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
        messages: { orderBy: { created_at: "desc" }, take: 1 },
      },
    });
  },

  async getUnreadCounts(roomIds, myProfileId) {
    const counts = await prisma.message.groupBy({
      by: ["room_id"],
      where: {
        room_id: { in: roomIds },
        sender_id: { not: myProfileId },
        is_read: false,
      },
      _count: { id: true },
    });
    return Object.fromEntries(counts.map((u) => [u.room_id, u._count.id]));
  },

  async upsertRoom(profileId1, profileId2) {
    const [p1, p2] = [profileId1, profileId2].sort();
    return await prisma.chatRoom.upsert({
      where: { profile1_id_profile2_id: { profile1_id: p1, profile2_id: p2 } },
      update: {},
      create: { profile1_id: p1, profile2_id: p2 },
    });
  }
};