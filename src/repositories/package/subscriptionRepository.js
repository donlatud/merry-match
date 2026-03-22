import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

/**
 * หา subscription ตาม id (ใช้ใน pay-mock / success flow)
 *
 * @param {number} subscriptionId
 * @returns {Promise<import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }> | null>}
 */
export async function findSubscriptionById(subscriptionId) {
  if (!subscriptionId) return null;
  return prisma.userSubscription.findUnique({
    where: { id: Number(subscriptionId) },
    include: { package: true },
  });
}

/**
 * หา subscription ตาม Omise subscription id (ใช้เมื่อ webhook มาจาก charge ของ Omise recurring)
 *
 * @param {string} omiseSubscriptionId
 * @returns {Promise<import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }> | null>}
 */
export async function findSubscriptionByOmiseSubscriptionId(omiseSubscriptionId) {
  if (!omiseSubscriptionId || typeof omiseSubscriptionId !== "string") return null;
  const id = omiseSubscriptionId.trim();
  if (!id) return null;
  return prisma.userSubscription.findFirst({
    where: { omise_subscription_id: id },
    include: { package: true },
  });
}

/**
 * สร้างหรืออัปเดต subscription ของโปรไฟล์ให้เป็นสถานะ PENDING
 * - ใช้ profile_id เป็น key (1 โปรไฟล์ มี 1 subscription ตาม constraint)
 * - รวม package กลับมาใน result เพื่อใช้ข้อมูลราคาสำหรับสร้าง payment session
 *
 * @param {{ profileId: string; packageId: number }} params
 * @returns {Promise<import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }>}
 */
export async function upsertPendingSubscription({ profileId, packageId }) {
  const now = new Date();

  return prisma.userSubscription.upsert({
    where: { profile_id: profileId },
    create: {
      profile_id: profileId,
      package_id: packageId,
      status: SubscriptionStatus.PENDING,
      start_date: now,
      end_date: null,
      gateway: null,
      external_charge_id: null,
      paid_at: null,
    },
    update: {
      package_id: packageId,
      status: SubscriptionStatus.PENDING,
      start_date: now,
      end_date: null,
      gateway: null,
      external_charge_id: null,
      paid_at: null,
    },
    include: {
      package: true,
    },
  });
}

