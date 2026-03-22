import { prisma } from "@/lib/prisma";

/**
 * Repository สำหรับ GET /api/me — ไม่ใช้ profileRepository ของ matching
 */
export const meRepository = {
  /**
   * ดึง profile จาก user_id พร้อม subscription, package, details
   */
  async findProfileWithSubscription(userId) {
    return await prisma.profile.findUnique({
      where: { user_id: userId },
      include: {
        subscription: {
          include: {
            package: {
              include: {
                details: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * ดึง profile id + รูปแรก (สำหรับ GET /api/me/profile-image)
   */
  async findProfileIdAndFirstImage(userId) {
    return await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        images: {
          select: { image_url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });
  },
};
