// src/services/matching/swipe.service.js
import { profileRepository } from "@/repositories/matching/profile.repository";
import { swipeRepository } from "@/repositories/matching/swipe.repository";


export const swipeService = {
  /**
   * Business Logic สำหรับการสร้าง Swipe
   */
  async createSwipe({ userId, receiverId, status }) {


    // [1] ดึงโปรไฟล์ของ User
    const myProfile = await profileRepository.findByUserId(userId);

    if (!myProfile) {
      throw new Error("Profile not found");
    }

    // [2] ตรวจสอบว่าเคย Swipe โปรไฟล์นี้ไปแล้วหรือยัง
    const existingSwipe = await swipeRepository.findSwipe(
      myProfile.id,
      receiverId
    );

    if (existingSwipe) {
      throw new Error("Already swiped this profile");
    }

    // [3] บันทึก Swipe ใหม่
    const newSwipe = await swipeRepository.createSwipe({
      requesterId: myProfile.id,
      receiverId,
      status,
    });

    // [4] เช็คว่ามี Match หรือไม่ (เฉพาะกรณี LIKE)
    let isMatch = false;
    if (status === "LIKE") {
      isMatch = await this.checkMatch(receiverId, myProfile.id);
    }

    return {
      swipe: newSwipe,
      isMatch,
    };
  },

  /**
   * ตรวจสอบว่ามี Match หรือไม่
   * (คู่กรณีต้อง LIKE กลับด้วย)
   */
  async checkMatch(receiverId, myProfileId) {
    const partnerSwipe = await swipeRepository.findSwipe(
      receiverId,
      myProfileId
    );

    return partnerSwipe && partnerSwipe.status === "LIKE";
  }
};