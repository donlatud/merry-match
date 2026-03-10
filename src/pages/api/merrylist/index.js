import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

function calculateAge(birthday) {
  const today = new Date();
  const date = new Date(birthday);
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    await authMiddleware(req, res);

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const me = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!me) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    const myProfileId = me.id;

    const [outgoingLikes, incomingLikes, activeSubscription] = await Promise.all([
      prisma.swipe.findMany({
        where: {
          requester_id: myProfileId,
          status: "LIKE",
        },
        select: {
          receiver_id: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.swipe.findMany({
        where: {
          receiver_id: myProfileId,
          status: "LIKE",
        },
        select: {
          requester_id: true,
        },
      }),
      prisma.userSubscription.findFirst({
        where: {
          profile_id: myProfileId,
          status: "ACTIVE",
        },
        include: {
          package: {
            select: { limit_matching: true, name: true },
          },
        },
        orderBy: { start_date: "desc" },
      }),
    ]);

    // คนที่เรากด like ไปทั้งหมด (requester = เรา, receiver = เขา, status = LIKE)
    const receiverIds = [...new Set(outgoingLikes.map((s) => s.receiver_id))];
    const receiverIdSet = new Set(receiverIds);
    // คนที่กด like เรา (receiver = เรา, requester = เขา) → ใช้เช็ค Merry Match + merryToYou list
    const whoLikedUsProfileIds = [...new Set(incomingLikes.map((s) => s.requester_id))];

    // ดึงข้อมูลจากตาราง profiles ตรง ๆ ตาม receiver_id (เป็น profile.id)
    const [targetProfiles, whoLikedUsProfiles] = await Promise.all([
      receiverIds.length
        ? prisma.profile.findMany({
            where: { id: { in: receiverIds } },
            include: {
              images: { orderBy: { order: "asc" } },
            },
          })
        : [],
      whoLikedUsProfileIds.length
        ? prisma.profile.findMany({
            where: { id: { in: whoLikedUsProfileIds } },
            include: {
              images: { orderBy: { order: "asc" } },
            },
          })
        : [],
    ]);

    const profileById = new Map(targetProfiles.map((p) => [p.id, p]));

    // list = คนที่เรา like ทุกคน; status 0 = Not Match yet, 1 = Merry Match!
    const list = outgoingLikes
      .map((swipe) => {
        const p = profileById.get(swipe.receiver_id);
        if (!p) return null;
        const theyLikedUs = whoLikedUsProfileIds.includes(p.id);
        return {
          id: p.id,
          name: p.full_name,
          age: calculateAge(p.birthday),
          location: p.location,
          sexualIdentity: p.gender,
          sexualPreference: p.sexual_preference,
          racialPreference: p.racial_preference,
          meetingInterest: p.meeting_interest,
          images: (p.images ?? []).map((img) => img.image_url),
          status: theyLikedUs ? 1 : 0, // 1 = Merry Match!, 0 = Not Match yet
        };
      })
      .filter(Boolean);

    // list ของคนที่กด like เรา (Merry to you) แต่เรายังไม่ได้ like เขากลับ
    const pendingWhoLikedUsProfiles = whoLikedUsProfiles.filter(
      (p) => !receiverIdSet.has(p.id)
    );

    const merryToYouList = pendingWhoLikedUsProfiles.map((p) => ({
      id: p.id,
      name: p.full_name,
      age: calculateAge(p.birthday),
      location: p.location,
      sexualIdentity: p.gender,
      sexualPreference: p.sexual_preference,
      racialPreference: p.racial_preference,
      meetingInterest: p.meeting_interest,
      images: (p.images ?? []).map((img) => img.image_url),
      status: 0,
    }));

    const merryToYou = pendingWhoLikedUsProfiles.length;
    const merryMatch = list.filter((p) => p.status === 1).length;

    const { start, end } = getTodayRange();
    const usedToday = await prisma.swipe.count({
      where: {
        requester_id: myProfileId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });
    const dailyLimit = activeSubscription?.package?.limit_matching ?? 20;
    const subscriptionPackageName = activeSubscription?.package?.name ?? null;

    return res.status(200).json({
      merryToYou,
      merryMatch,
      merryLimit: {
        used: usedToday,
        total: dailyLimit,
        resetAt: "00:00",
      },
      list,
      merryToYouList,
      subscriptionPackageName,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}

