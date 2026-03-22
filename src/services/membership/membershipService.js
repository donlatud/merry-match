import { prisma } from "@/lib/prisma";
import { hasActiveMembership } from "@/lib/membershipHelpers";

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
 * ตรวจสอบว่า subscription ยังใช้งานได้หรือไม่
 * - ACTIVE หรือ CANCELLED (ยกเลิกแล้วแต่ยังไม่ถึง end_date) และยังไม่หมดอายุ
 * ใช้ logic ร่วมกับ hasActiveMembership จาก lib/membershipHelpers
 *
 * @param {import("@prisma/client").UserSubscription | null} subscription
 * @param {Date} [now] - ไม่ใช้แล้ว (คงไว้เพื่อความ backward compatible)
 * @returns {boolean}
 */
export function isSubscriptionActiveAndValid(subscription) {
  return hasActiveMembership(subscription);
}

/**
 * ตรวจสอบสถานะ Merry Membership ของ user
 * - ถ้าไม่มี subscription เลย → ถือว่าเป็นสายฟรี (subscription = null)
 * - ถ้ามี subscription แต่หมดอายุ / ไม่ ACTIVE → คืน isActive=false และ subscription=null (ใช้สิทธิ์แบบ free)
 * - ถ้ามี subscription และยังไม่หมดอายุ → คืน subscription + expireAt + isActive=true
 *
 * ❗ ปัจจุบันไม่โยน error แล้ว (ไม่บังคับให้ต้อง ACTIVE เสมอ) เพื่อให้ "สาย free" ใช้งานฟีเจอร์พื้นฐานได้
 *
 * @param {string} userId
 * @returns {Promise<{ subscription: (import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }) | null; expireAt: Date | null; isActive: boolean }>}
 */
export async function assertActiveMembershipForUser(userId) {
  const subscription = await getCurrentUserSubscription(userId);

  if (!subscription || !isSubscriptionActiveAndValid(subscription)) {
    return {
      subscription: null,
      expireAt: null,
      isActive: false,
    };
  }

  return {
    subscription,
    expireAt: subscription.end_date,
    isActive: true,
  };
}

