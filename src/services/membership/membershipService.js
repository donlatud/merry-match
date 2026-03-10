import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

/**
 * ดึง subscription ปัจจุบันของ user (ถ้ามี)
 *
 * @param {string} userId
 * @returns {Promise<(import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }) | null>}
 */
export async function getCurrentUserSubscription(userId) {
  if (!userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  return profile?.subscription ?? null;
}

/**
 * ตรวจสอบว่า subscription ยังใช้งานได้หรือไม่ (ACTIVE และยังไม่หมดอายุ)
 *
 * @param {import("@prisma/client").UserSubscription | null} subscription
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isSubscriptionActiveAndValid(subscription, now = new Date()) {
  if (!subscription) return false;
  if (subscription.status !== SubscriptionStatus.ACTIVE) return false;

  if (!subscription.end_date) return false;

  const end = subscription.end_date instanceof Date ? subscription.end_date : new Date(subscription.end_date);
  return end.getTime() > now.getTime();
}

/**
 * ตรวจสอบสิทธิ์ Merry Membership ของ user
 * - ถ้าไม่มีสิทธิ์ หรือหมดอายุแล้ว → throw error MEMBESHIP_REQUIRED (statusCode 403)
 * - ถ้ามีสิทธิ์ และยังไม่หมดอายุ → คืนรายละเอียด subscription กลับไปใช้ต่อ
 *
 * @param {string} userId
 * @returns {Promise<{ subscription: import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }; expireAt: Date }>}
 */
export async function assertActiveMembershipForUser(userId) {
  const subscription = await getCurrentUserSubscription(userId);

  if (!subscription || !isSubscriptionActiveAndValid(subscription)) {
    const error = new Error("MEMBERSHIP_REQUIRED");
    error.statusCode = 403;
    throw error;
  }

  return {
    subscription,
    expireAt: subscription.end_date,
  };
}

