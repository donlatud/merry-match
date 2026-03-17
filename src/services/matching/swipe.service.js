// src/services/matching/swipe.service.js
import { profileRepository } from "@/repositories/matching/profile.repository";
import { swipeRepository } from "@/repositories/matching/swipe.repository";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";


export const swipeService = {
  async createSwipe({ userId, receiverId, status }) {
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

  async unlikeSwipe({ userId, receiverId }) {
    if (!receiverId) throw new Error("receiverId is required");

    const myProfile = await profileRepository.findByUserId(userId);
    if (!myProfile) throw new Error("Profile not found");

    const myLike = await swipeRepository.findSwipe(myProfile.id, receiverId);
    if (!myLike || myLike.status !== "LIKE") {
      throw new Error("Like not found");
    }

    const partnerLike = await swipeRepository.findSwipe(receiverId, myProfile.id);
    const isMutual = partnerLike?.status === "LIKE";

    // เก็บ URL รูปจากข้อความแชทไว้เพื่อลบออกจาก Supabase Storage หลังจบ transaction
    let chatImageUrlsToDelete = [];

    const result = await prisma.$transaction(async (tx) => {
      if (!isMutual) {
        const deleted = await swipeRepository.deleteOneLike(
          myProfile.id,
          receiverId,
          tx,
        );
        return {
          mode: "ONE_WAY",
          deleted: {
            swipes: deleted.count,
            messages: 0,
            chatRoom: 0,
          },
        };
      }

      const deletedSwipes = await swipeRepository.deleteLikePair(
        myProfile.id,
        receiverId,
        tx,
      );

      const [p1, p2] = [myProfile.id, receiverId].sort();
      const room = await tx.chatRoom.findUnique({
        where: {
          profile1_id_profile2_id: { profile1_id: p1, profile2_id: p2 },
        },
      });

      let deletedMessagesCount = 0;
      let deletedRoomCount = 0;

      if (room) {
        // ดึง message ที่มีรูปทั้งหมดจากห้องนี้ เพื่อนำ URL ไปลบออกจาก Storage
        const messagesWithImages = await tx.message.findMany({
          where: {
            room_id: room.id,
            image_urls: {
              isEmpty: false,
            },
          },
          select: {
            image_urls: true,
          },
        });
        chatImageUrlsToDelete = messagesWithImages.flatMap(
          (m) => m.image_urls ?? [],
        );

        const deletedMessages = await tx.message.deleteMany({
          where: { room_id: room.id },
        });
        deletedMessagesCount = deletedMessages.count;

        await tx.chatRoom.delete({
          where: { id: room.id },
        });
        deletedRoomCount = 1;
      }

      return {
        mode: "MUTUAL",
        deleted: {
          swipes: deletedSwipes.count,
          messages: deletedMessagesCount,
          chatRoom: deletedRoomCount,
        },
      };
    });

    // ลบไฟล์รูปใน Supabase Storage (bucket: chat-images) ถ้ามี
    try {
      const CHAT_BUCKET = "chat-images";
      const imagePaths = chatImageUrlsToDelete
        .filter((url) => typeof url === "string" && url.trim().length > 0)
        .map((url) => {
          const marker = `${CHAT_BUCKET}/`;
          const idx = url.indexOf(marker);
          if (idx === -1) return url;
          return url.slice(idx + marker.length);
        });

      if (imagePaths.length > 0) {
        await supabaseServer.storage.from(CHAT_BUCKET).remove(imagePaths);
      }
    } catch (err) {
      // ไม่ให้การลบ swipe ล้มเหลวเพราะลบไฟล์ไม่สำเร็จ
      console.error("Failed to delete chat images from storage:", err);
    }

    return result;
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