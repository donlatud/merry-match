// src/services/matching/swipe.service.js
import { profileRepository } from "@/repositories/matching/profile.repository";
import { swipeRepository } from "@/repositories/matching/swipe.repository";
import { prisma } from "@/lib/prisma";
import { assertActiveMembershipForUser } from "@/services/membership/membershipService";

export const swipeService = {
  async createSwipe({ userId, receiverId, status }) {
    // [0] ตรวจสอบสิทธิ์ Merry Membership (ต้อง ACTIVE และยังไม่หมดอายุ)
    await assertActiveMembershipForUser(userId);

    // [1] ดึงโปรไฟล์ของ User
    const myProfile = await profileRepository.findByUserId(userId);
    if (!myProfile) throw new Error("Profile not found");

    const existingSwipe = await swipeRepository.findSwipe(myProfile.id, receiverId);
    if (existingSwipe) throw new Error("Already swiped this profile");

    const newSwipe = await swipeRepository.createSwipe({
      requesterId: myProfile.id,
      receiverId,
      status,
    });

    let isMatch = false;
    if (status === "LIKE") {
      isMatch = await this.checkMatch(receiverId, myProfile.id);

      // ✅ สร้าง chat room ทันทีเมื่อ match
      if (isMatch) {
        await this.createChatRoom(myProfile.id, receiverId);
      }
    }

    return { swipe: newSwipe, isMatch };
  },

  async checkMatch(receiverId, myProfileId) {
    const partnerSwipe = await swipeRepository.findSwipe(receiverId, myProfileId);
    return partnerSwipe?.status === "LIKE";
  },

  // ✅ สร้าง room — เรียง id เพื่อป้องกัน duplicate
  async createChatRoom(profileId1, profileId2) {
    const [p1, p2] = [profileId1, profileId2].sort();
    await prisma.chatRoom.upsert({
      where: {
        profile1_id_profile2_id: { profile1_id: p1, profile2_id: p2 },
      },
      update: {},
      create: { profile1_id: p1, profile2_id: p2 },
    });
  },
};