// src/repositories/matching/profile.repository.js
import { prisma } from "@/lib/prisma";

export const profileRepository = {
  /**
   * ดึงโปรไฟล์จาก user_id (ธรรมดา)
   */
  async findByUserId(userId) {
    return await prisma.profile.findUnique({
      where: { user_id: userId },
    });
  },

  /**
   * ดึงโปรไฟล์จาก user_id พร้อม Subscription และ Package
   */
  async findByUserIdWithSubscription(userId) {
    return await prisma.profile.findUnique({
      where: { user_id: userId },
      include: {
        subscription: {
          include: {
            package: true,
          },
        },
      },
    });
  },

  /**
   * ดึงรายการโปรไฟล์ที่ตรงเงื่อนไขสำหรับ Matching
   */
  async findMatchingProfiles({ excludeIds, birthdayMin, birthdayMax, genders }) {
    const whereClause = {
      id: { notIn: excludeIds },
      birthday: { gte: birthdayMin, lte: birthdayMax },
    };

    // เพิ่มเงื่อนไข gender ถ้ามีการระบุ
    if (genders && genders.length > 0) {
      whereClause.gender = { in: genders.split(",") };
    }

    return await prisma.profile.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { order: "asc" } },
      },
      orderBy: { id: "asc" },
    });
  }
};