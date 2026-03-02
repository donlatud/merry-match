// src/services/matching/matching.service.js
import { profileRepository } from "@/repositories/matching/profile.repository";
import { swipeRepository } from "@/repositories/matching/swipe.repository";

export const matchingService = {
  /**
   * Business Logic สำหรับการดึงโปรไฟล์ Matching
   */
  async getMatchingProfiles(userId, filters) {
    // [1] ดึงโปรไฟล์ของ User พร้อม Subscription
    const myProfile = await profileRepository.findByUserIdWithSubscription(userId);

    if (!myProfile) {
      throw new Error("Profile not found for this user_id");
    }

    // [2] คำนวณช่วงวันเกิดจากอายุ
    const dateRange = this.calculateBirthdayRange(filters.ageMin, filters.ageMax);

    // [3] ดึงรายการ ID ที่ Swipe ไปแล้ว + ตัวเอง
    const excludeIds = await swipeRepository.getSwipedProfileIds(myProfile.id);
    excludeIds.push(myProfile.id);

    // [4] ดึงโปรไฟล์ทั้งหมดที่ตรงเงื่อนไข
    const profiles = await profileRepository.findMatchingProfiles({
      excludeIds,
      birthdayMin: dateRange.birthdayMin,
      birthdayMax: dateRange.birthdayMax,
      genders: filters.genders,
    });

    // [5] นับจำนวน Swipe ที่ใช้ไปวันนี้
    const swipeUsedToday = await swipeRepository.countTodaySwipes(myProfile.id);

    // [6] คำนวณข้อมูล Swipe Limit
    const swipeData = this.calculateSwipeLimit(myProfile, swipeUsedToday);

    // [7] Format ข้อมูลโปรไฟล์
    const formattedProfiles = profiles.map((profile) => this.formatProfile(profile));

    // [8] ส่งผลลัพธ์
    return {
      profiles: formattedProfiles,
      total: formattedProfiles.length,
      ...swipeData,
      myProfileId: myProfile.id,
    };
  },

  /**
   * คำนวณช่วงวันเกิดจากอายุขั้นต่ำและสูงสุด
   */
  calculateBirthdayRange(ageMin, ageMax) {
    const now = new Date();
    const birthdayMin = new Date(
      now.getFullYear() - ageMax - 1,
      now.getMonth(),
      now.getDate()
    );
    const birthdayMax = new Date(
      now.getFullYear() - ageMin,
      now.getMonth(),
      now.getDate()
    );

    return { birthdayMin, birthdayMax };
  },

  /**
   * คำนวณ Swipe Limit และจำนวนที่เหลือ
   */
  calculateSwipeLimit(profile, swipeUsedToday) {
    const rawLimit = profile.subscription?.package?.limit_matching ?? 20;

    const swipeLimit = rawLimit === 999 ? "Unlimited" : rawLimit;
    const swipeRemaining = rawLimit === 999 
      ? "Unlimited" 
      : Math.max(rawLimit - swipeUsedToday, 0);

    return {
      swipeLimit,
      swipeUsedToday,
      swipeRemaining,
    };
  },

  /**
   * Format ข้อมูลโปรไฟล์สำหรับส่งกลับ
   */
  formatProfile(profile) {
    const now = new Date();
    const birthDate = new Date(profile.birthday);
    let age = now.getFullYear() - birthDate.getFullYear();

    if (now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
      age--;
    }

    return {
      id: profile.id,
      name: profile.full_name,
      age,
      location: `${profile.city}, ${profile.location}`,
      gender: profile.gender,
      bio: profile.bio,
      images: profile.images.map((img) => img.image_url),
      image: profile.images[0]?.image_url ?? null,
    };
  }
};