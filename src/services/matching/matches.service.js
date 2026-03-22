// src/services/matching/matches.service.js
import { profileRepository } from "@/repositories/matching/profile.repository";
import { swipeRepository } from "@/repositories/matching/swipe.repository";

export const matchesService = {
  /**
   * Business Logic สำหรับดึงรายการ Matches ของ User
   */
  async getUserMatches(userId) {
    // [1] ดึงโปรไฟล์ของ User
    const myProfile = await profileRepository.findByUserId(userId);

    if (!myProfile) {
      throw new Error("Profile not found");
    }

    // [2] หารายการคนที่เรา LIKE ไปแล้ว
    const myLikedIds = await swipeRepository.getLikedProfileIds(myProfile.id);

    // ถ้าไม่มีคนที่เรา LIKE เลย ก็ไม่มี Match
    if (myLikedIds.length === 0) {
      return [];
    }

    // [3] หา Mutual Likes (Match) - คนที่ LIKE เรากลับด้วย
    const matches = await swipeRepository.findMutualLikes(
      myLikedIds,
      myProfile.id
    );

    // [4] Format ข้อมูลสำหรับ Response
    const formattedMatches = matches.map((match) => this.formatMatch(match));

    return formattedMatches;
  },

  /**
   * Format ข้อมูล Match สำหรับส่งกลับ
   */
  formatMatch(match) {
    const date = new Date(match.created_at);
    const formattedDate = this.formatDate(date);

    return {
      matchId: match.id,
      profileId: match.requester.id,
      name: match.requester.full_name,
      image: match.requester.images[0]?.image_url ?? null,
      matchedAt: match.created_at,           // ISO string สำหรับ sort
      matchedAtFormatted: formattedDate,     // dd/mm/yyyy สำหรับ display
      // lastMessageAt: null,                // TODO: เพิ่มเมื่อมี chat
      // lastMessage: null,                  // TODO: เพิ่มเมื่อมี chat
    };
  },

  /**
   * Format วันที่เป็น dd/mm/yyyy
   */
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};