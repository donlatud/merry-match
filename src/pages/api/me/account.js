import { prisma } from "@/lib/prisma";
import { PROFILE_IMAGES_BUCKET } from "@/lib/storageHelpers";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function handler(req, res) {
  try {
    // อนุญาตเฉพาะ DELETE
    allowMethods(["DELETE"])(req, res);

    // ต้องเป็นผู้ใช้ที่ล็อกอินอยู่เท่านั้น
    await authMiddleware(req, res);

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    // หา profile ปัจจุบันจาก user_id
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: {
        images: true,
      },
    });

    if (!profile) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    const profileId = profile.id;
    const profileImages = profile.images ?? [];

    // ใช้ transaction เพื่อลบข้อมูลที่เกี่ยวข้องทั้งหมด รวมถึง chat rooms และ messages และ User
    await prisma.$transaction(async (tx) => {
      // หา chat rooms ที่เกี่ยวข้องกับ profile นี้
      const rooms = await tx.chatRoom.findMany({
        where: {
          OR: [{ profile1_id: profileId }, { profile2_id: profileId }],
        },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);

      if (roomIds.length > 0) {
        // ลบข้อความในห้องแชททั้งหมด
        await tx.message.deleteMany({
          where: { room_id: { in: roomIds } },
        });

        // ลบห้องแชททั้งหมด
        await tx.chatRoom.deleteMany({
          where: { id: { in: roomIds } },
        });
      }

      // ลบ swipe ที่เกี่ยวข้องกับ profile นี้ (ทั้ง requester และ receiver)
      await tx.swipe.deleteMany({
        where: {
          OR: [{ requester_id: profileId }, { receiver_id: profileId }],
        },
      });

      // ลบ notifications ที่ profile นี้เป็นผู้รับหรือผู้กระทำ หรือผูกกับห้องแชทที่ถูกลบ
      await tx.notification.deleteMany({
        where: {
          OR: [
            { recipient_id: profileId },
            { actor_id: profileId },
            roomIds.length ? { room_id: { in: roomIds } } : undefined,
          ].filter(Boolean),
        },
      });

      // ลบ subscription ทั้งหมดของ profile นี้
      await tx.userSubscription.deleteMany({
        where: { profile_id: profileId },
      });

      // ลบความสัมพันธ์อื่น ๆ ของ profile (เช่น hobbies, images)
      await tx.profileHobby.deleteMany({
        where: { profile_id: profileId },
      });

      await tx.profileImage.deleteMany({
        where: { profile_id: profileId },
      });

      // ลบ profile สุดท้าย
      await tx.profile.delete({
        where: { id: profileId },
      });

      // ลบ User record ในฐานข้อมูล (จะ cascade ไป profile ผ่าน relation อยู่แล้ว แต่เราลบเองเพื่อความชัดเจน)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // ลบไฟล์รูปโปรไฟล์ออกจาก Supabase Storage (ถ้ามี)
    try {
      const imagePaths = profileImages
        .map((img) => img.image_url)
        .filter((url) => typeof url === "string" && url.trim().length > 0)
        // ถ้าเก็บเป็น public URL ให้แปลงเป็น path; ถ้าเก็บเป็น path อยู่แล้วให้ return ตรง ๆ
        .map((url) => {
          // กรณีเป็น public URL: .../merry-match-bucket/<path>
          const marker = `${PROFILE_IMAGES_BUCKET}/`;
          const idx = url.indexOf(marker);
          if (idx === -1) return url;
          return url.slice(idx + marker.length);
        });

      if (imagePaths.length > 0) {
        await supabaseServer.storage.from(PROFILE_IMAGES_BUCKET).remove(imagePaths);
      }
    } catch (storageErr) {
      // ถ้าลบไฟล์ไม่ได้ ไม่ต้อง fail การลบ account ทั้งหมด แค่ log ไว้ก็พอ
      console.error("Failed to delete profile images from storage:", storageErr);
    }

    // ลบ Supabase Auth user (ต้องใช้ service role key ใน supabaseServer)
    try {
      const { error: authError } = await supabaseServer.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Failed to delete Supabase auth user:", authError);
      }
    } catch (authErr) {
      console.error("Unexpected error while deleting Supabase auth user:", authErr);
    }

    return res.status(200).json({
      ok: true,
      message:
        "Account and related data (including chat rooms/messages, profile images, User record, and auth user) have been deleted.",
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
