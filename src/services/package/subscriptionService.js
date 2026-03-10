import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";
import { upsertPendingSubscription } from "@/repositories/package/subscriptionRepository";
import { findSubscriptionById } from "@/repositories/package/subscriptionRepository";
import { PENDING_SUBSCRIPTION_EXPIRE_MS } from "@/config/subscriptionConfig";

/**
 * สร้าง subscription แบบ PENDING เมื่อ user เลือกแพ็กเกจ
 *
 * ขั้นตอน:
 * 1. หา profile จาก userId
 * 2. ตรวจสอบว่า package ที่เลือกยัง active และซื้อได้ (price > 0)
 * 3. upsert subscription ให้เป็นสถานะ PENDING
 * 4. คืนข้อมูลสำหรับเริ่มสร้าง payment session ต่อไป
 *
 * @param {{ userId: string; packageId: number }} params
 * @returns {Promise<{ subscriptionId: number; amount: string; currency: string; packageName: string }>}
 */
export async function createPendingSubscription({ userId, packageId }) {
  if (!userId || !packageId) {
    const err = new Error("MISSING_USER_OR_PACKAGE");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
  });

  if (!profile) {
    const err = new Error("PROFILE_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  const pkg = await prisma.package.findFirst({
    where: {
      id: packageId,
      is_active: true,
      price: { gt: 0 },
    },
  });

  if (!pkg) {
    const err = new Error("PACKAGE_NOT_FOUND_OR_INACTIVE");
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.userSubscription.findUnique({
    where: { profile_id: profile.id },
    include: { package: true },
  });

  // Prevent overriding an active (non-expired) subscription back to PENDING.
  if (existing?.status === SubscriptionStatus.ACTIVE) {
    const isValid =
      existing.end_date instanceof Date ? existing.end_date.getTime() > now.getTime() : true;
    if (isValid) {
      const err = new Error("SUBSCRIPTION_ALREADY_ACTIVE");
      err.statusCode = 409;
      throw err;
    }
  }

  // If payment is already in progress for the current PENDING subscription, keep it as-is.
  // This ensures 1 subscription = 1 charge waiting for webhook.
  if (
    existing?.status === SubscriptionStatus.PENDING &&
    typeof existing.external_charge_id === "string" &&
    existing.external_charge_id.length > 0
  ) {
    const isExpired =
      existing.start_date instanceof Date &&
      now.getTime() - existing.start_date.getTime() > PENDING_SUBSCRIPTION_EXPIRE_MS;
    if (isExpired) {
      // Allow starting a new flow by resetting to a fresh PENDING subscription.
      // (pay-card/pay-qr will also reject the old one with 410)
    } else {
    if (existing.package_id !== pkg.id) {
      const err = new Error("PAYMENT_IN_PROGRESS");
      err.statusCode = 409;
      throw err;
    }
    return {
      subscriptionId: existing.id,
      amount: existing.package?.price?.toString?.() ?? pkg.price.toString(),
      currency: existing.package?.currency ?? pkg.currency,
      packageName: existing.package?.name ?? pkg.name,
    };
    }
  }

  const subscription = await upsertPendingSubscription({
    profileId: profile.id,
    packageId: pkg.id,
  });

  return {
    subscriptionId: subscription.id,
    amount: pkg.price.toString(),
    currency: pkg.currency,
    packageName: pkg.name,
  };
}

/**
 * Shared validation for pay-card / pay-qr flows.
 * Ensures subscription exists, belongs to profileId, has correct status,
 * not expired, no duplicate payments, and resolves target package for change-plan.
 *
 * @param {{ subscriptionId: number; targetPackageId?: number | null; profileId: string }}
 * @returns {Promise<{ subscription: import("@prisma/client").UserSubscription & { package: import("@prisma/client").Package }; pkg: import("@prisma/client").Package; isChangePlan: boolean }>}
 */
export async function validatePaymentRequest({ subscriptionId, targetPackageId, profileId }) {
  const id = Number(subscriptionId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error("INVALID_SUBSCRIPTION_ID");
    err.statusCode = 400;
    throw err;
  }

  const parsedTargetId =
    typeof targetPackageId === "string"
      ? Number.parseInt(targetPackageId, 10)
      : targetPackageId;
  const isChangePlan = Number.isInteger(parsedTargetId) && parsedTargetId > 0;

  const subscription = await findSubscriptionById(id);
  if (!subscription?.package) {
    const err = new Error("SUBSCRIPTION_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  if (subscription.profile_id !== profileId) {
    const err = new Error("SUBSCRIPTION_NOT_OWNED");
    err.statusCode = 403;
    throw err;
  }

  if (!isChangePlan) {
    if (
      subscription.status === SubscriptionStatus.PENDING &&
      subscription.start_date instanceof Date &&
      Date.now() - subscription.start_date.getTime() > PENDING_SUBSCRIPTION_EXPIRE_MS
    ) {
      const err = new Error("SUBSCRIPTION_PENDING_EXPIRED");
      err.statusCode = 410;
      throw err;
    }

    if (subscription.status !== SubscriptionStatus.PENDING) {
      const err = new Error("SUBSCRIPTION_NOT_PENDING");
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      const err = new Error("SUBSCRIPTION_NOT_ACTIVE");
      err.statusCode = 409;
      throw err;
    }
  }

  if (
    !isChangePlan &&
    typeof subscription.external_charge_id === "string" &&
    subscription.external_charge_id.length > 0
  ) {
    const err = new Error("PAYMENT_IN_PROGRESS");
    err.statusCode = 409;
    throw err;
  }

  const pendingTx = await prisma.paymentTransaction.findFirst({
    where: {
      user_subscription_id: subscription.id,
      status: PaymentTransactionStatus.PENDING,
    },
    select: { id: true },
    orderBy: { created_at: "desc" },
  });
  if (pendingTx) {
    const err = new Error("PAYMENT_IN_PROGRESS");
    err.statusCode = 409;
    throw err;
  }

  let pkg = subscription.package;
  if (isChangePlan) {
    const targetPkg = await prisma.package.findFirst({
      where: { id: parsedTargetId, is_active: true, price: { gt: 0 } },
    });
    if (!targetPkg) {
      const err = new Error("PACKAGE_NOT_FOUND_OR_INACTIVE");
      err.statusCode = 404;
      throw err;
    }
    if (targetPkg.id === subscription.package_id) {
      const err = new Error("PACKAGE_ALREADY_ACTIVE");
      err.statusCode = 409;
      throw err;
    }
    pkg = targetPkg;
  }

  return { subscription, pkg, isChangePlan };
}

/**
 * Prepare change-plan payload for the current user (used by /api/package/change-plan).
 *
 * @param {{ userId: string; targetPackageId: number }}
 */
export async function prepareChangePlan({ userId, targetPackageId }) {
  const parsedTargetId =
    typeof targetPackageId === "string"
      ? Number.parseInt(targetPackageId, 10)
      : targetPackageId;
  if (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0) {
    const err = new Error("INVALID_BODY");
    err.statusCode = 400;
    throw err;
  }

  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
    select: {
      id: true,
      subscription: {
        include: { package: true },
      },
    },
  });

  if (!profile) {
    const err = new Error("PROFILE_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  const currentSubscription = profile.subscription;
  if (!currentSubscription?.package) {
    const err = new Error("SUBSCRIPTION_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const isActiveAndValid =
    currentSubscription.status === SubscriptionStatus.ACTIVE &&
    currentSubscription.end_date instanceof Date &&
    currentSubscription.end_date.getTime() > now.getTime();

  if (!isActiveAndValid) {
    const err = new Error("SUBSCRIPTION_NOT_ACTIVE");
    err.statusCode = 409;
    throw err;
  }

  const targetPackage = await prisma.package.findFirst({
    where: {
      id: parsedTargetId,
      is_active: true,
      price: { gt: 0 },
    },
  });

  if (!targetPackage) {
    const err = new Error("PACKAGE_NOT_FOUND_OR_INACTIVE");
    err.statusCode = 404;
    throw err;
  }

  if (targetPackage.id === currentSubscription.package_id) {
    const err = new Error("PACKAGE_ALREADY_ACTIVE");
    err.statusCode = 409;
    throw err;
  }

  const pendingTx = await prisma.paymentTransaction.findFirst({
    where: {
      user_subscription_id: currentSubscription.id,
      status: PaymentTransactionStatus.PENDING,
    },
    select: { id: true },
    orderBy: { created_at: "desc" },
  });
  if (pendingTx) {
    const err = new Error("PAYMENT_IN_PROGRESS");
    err.statusCode = 409;
    throw err;
  }

  const amount = String(targetPackage.price ?? "");

  const minimalPackage = (pkg) => ({
    id: pkg.id,
    name: pkg.name,
    price: String(pkg.price ?? ""),
    currency: pkg.currency ?? "THB",
    billing_interval: pkg.billing_interval ?? "month",
    features: Array.isArray(pkg.features) ? pkg.features : [],
  });

  return {
    mode: "change-plan",
    subscriptionId: currentSubscription.id,
    currentPackage: minimalPackage(currentSubscription.package),
    targetPackage: minimalPackage(targetPackage),
    amount,
    currency: targetPackage.currency ?? "THB",
  };
}


