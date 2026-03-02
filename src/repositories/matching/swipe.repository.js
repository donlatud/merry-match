// src/repositories/matching/swipe.repository.js
import { prisma } from "@/lib/prisma";

export const swipeRepository = {
  /**
   * ค้นหา Swipe ระหว่าง 2 โปรไฟล์
   */
  async findSwipe(requesterId, receiverId) {
    return await prisma.swipe.findFirst({
      where: {
        requester_id: requesterId,
        receiver_id: receiverId,
      },
    });
  },

  /**
   * สร้าง Swipe ใหม่
   */
  async createSwipe({ requesterId, receiverId, status }) {
    return await prisma.swipe.create({
      data: {
        requester_id: requesterId,
        receiver_id: receiverId,
        status,
      },
    });
  },

  /**
   * ดึงรายการ Profile ID ที่ User เคย Swipe ไปแล้ว (ทั้ง LIKE และ PASS)
   */
  async getSwipedProfileIds(profileId) {
    const swipedRecords = await prisma.swipe.findMany({
      where: { requester_id: profileId },
      select: { receiver_id: true },
    });

    return swipedRecords.map((s) => s.receiver_id);
  },

  /**
   * ดึงรายการ Profile ID ที่ User LIKE ไปแล้ว (เฉพาะ LIKE)
   */
  async getLikedProfileIds(profileId) {
    const likedRecords = await prisma.swipe.findMany({
      where: {
        requester_id: profileId,
        status: "LIKE",
      },
      select: { receiver_id: true },
    });

    return likedRecords.map((s) => s.receiver_id);
  },

  /**
   * หา Mutual Likes (Match) - คนที่เรา LIKE และเขา LIKE เรากลับ
   * เรียงตามวันที่ล่าสุดบนสุด
   */
  async findMutualLikes(myLikedIds, myProfileId) {
    return await prisma.swipe.findMany({
      where: {
        requester_id: { in: myLikedIds },
        receiver_id: myProfileId,
        status: "LIKE",
      },
      include: {
        requester: {
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * นับจำนวนครั้งที่ User กด LIKE ในวันนี้
   */
  async countTodaySwipes(profileId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return await prisma.swipe.count({
      where: {
        requester_id: profileId,
        status: "LIKE",
        created_at: { gte: todayStart },
      },
    });
  }
};