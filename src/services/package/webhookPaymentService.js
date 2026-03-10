import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";
import { findSubscriptionById } from "@/repositories/package/subscriptionRepository";
import {
  findTransactionByExternalChargeId,
  upsertTransactionFromWebhook,
} from "@/repositories/package/paymentTransactionRepository";
import {
  amountFromMajorToMinor,
  amountFromMinorToMajor,
} from "@/lib/currencyHelpers";

const GATEWAY_NAME = "omise";

/**
 * เช็กว่า event นี้คือชำระสำเร็จหรือไม่ (จาก type หรือ data.paid)
 */
function isSuccessEvent(event) {
  const type = (event?.type || "").toLowerCase();
  if (type.includes("complete") || type.includes("capture") || type === "charge.pay") return true;
  if (type.includes("fail") || type.includes("reverse")) return false;
  return event?.data?.paid === true;
}

/**
 * เช็กว่า event นี้คือกรณียกเลิก/หมดอายุ (treat เป็น CANCELLED)
 */
function isCancelledEvent(event) {
  const type = (event?.type || "").toLowerCase();
  const status = (event?.data?.status || "").toLowerCase();

  if (type.includes("cancel") || type.includes("reverse") || type.includes("expire")) return true;
  if (status === "canceled" || status === "cancelled" || status === "reversed" || status === "expired") {
    return true;
  }

  return false;
}

/**
 * คำนวณช่วงเวลา subscription จาก billing interval ของแพ็กเกจ
 * - ถ้า billing_interval = "month" → เพิ่ม 1 เดือน
 * - ถ้า billing_interval = "year" → เพิ่ม 1 ปี
 *
 * @param {import("@prisma/client").UserSubscription & { package?: import("@prisma/client").Package }} subscription
 * @param {Date | null} paidAt
 * @returns {{ startDate: Date; endDate: Date }}
 */
function calculateSubscriptionPeriod(subscription, paidAt) {
  const base = paidAt instanceof Date ? paidAt : new Date();
  const startDate = base;
  const endDate = new Date(startDate);

  const interval = (subscription?.package?.billing_interval || "month").toLowerCase();
  if (interval === "year") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    // default = month
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return { startDate, endDate };
}

/**
 * คำนวณช่วงเวลา subscription จาก package โดยตรง (ใช้สำหรับ change-plan)
 * @param {import("@prisma/client").Package} pkg
 * @param {Date | null} paidAt
 */
function calculateSubscriptionPeriodFromPackage(pkg, paidAt) {
  const base = paidAt instanceof Date ? paidAt : new Date();
  const startDate = base;
  const endDate = new Date(startDate);

  const interval = String(pkg?.billing_interval || "month").toLowerCase();
  if (interval === "year") endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  return { startDate, endDate };
}

function parseBool(v) {
  if (v === true) return true;
  if (typeof v === "string") return v.toLowerCase() === "true";
  if (typeof v === "number") return v === 1;
  return false;
}

function parseIntOrNull(v) {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * ประมวลผล webhook event จาก payment gateway
 * - หา UserSubscription จาก metadata.subscriptionId
 * - สร้างหรืออัปเดต PaymentTransaction (status PAID/FAILED)
 * - อัปเดต UserSubscription status (ACTIVE/FAILED), external_charge_id, paid_at
 * - log ข้อผิดพลาด (ไม่ throw เพื่อให้ webhook คืน 200 ให้ gateway)
 *
 * @param {{ id?: string; type?: string; data?: { chargeId?: string; amount?: number; currency?: string; status?: string; paid?: boolean; metadata?: Record<string, unknown> } }} event
 * @returns {{ processed: boolean; subscriptionId?: number; transactionStatus?: string; error?: string }}
 */
export async function processPaymentWebhookEvent(event) {
  const chargeId = event?.data?.chargeId || event?.data?.id;
  const metadata = event?.data?.metadata || {};
  const subscriptionIdRaw = metadata.subscriptionId ?? metadata.subscription_id;
  const subscriptionId =
    typeof subscriptionIdRaw === "string"
      ? parseInt(subscriptionIdRaw, 10)
      : Number(subscriptionIdRaw);

  if (!chargeId) {
    console.warn("[webhook/payment] Missing chargeId in event", event?.id, event?.type);
    return { processed: false, error: "MISSING_CHARGE_ID" };
  }

  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
    console.warn(
      "[webhook/payment] Missing or invalid subscriptionId in metadata",
      event?.id,
      metadata
    );
    return { processed: false, error: "MISSING_SUBSCRIPTION_ID" };
  }

  const isChangePlan = parseBool(metadata.changePlan ?? metadata.change_plan);
  const targetPackageId = parseIntOrNull(
    metadata.targetPackageId ?? metadata.target_package_id
  );

  const isSuccess = isSuccessEvent(event);
  const isCancelled = !isSuccess && isCancelledEvent(event);

  const transactionStatus = isSuccess
    ? PaymentTransactionStatus.PAID
    : PaymentTransactionStatus.FAILED;

  // For change-plan: do NOT downgrade the user's membership on failed/cancelled payments.
  const subscriptionStatus = isSuccess
    ? SubscriptionStatus.ACTIVE
    : isChangePlan
      ? null
      : isCancelled
        ? SubscriptionStatus.CANCELLED
        : SubscriptionStatus.FAILED;
  const paidAt = isSuccess ? new Date() : null;

  // Idempotency: if this chargeId was already recorded AND subscription is already in final state,
  // skip processing to avoid duplicate updates when gateways resend events.
  try {
    const existingTx = await findTransactionByExternalChargeId(chargeId);
    const existingSub = existingTx?.user_subscription || null;
    if (
      existingTx &&
      existingSub &&
      existingTx.user_subscription_id === subscriptionId &&
      existingTx.status === transactionStatus &&
      (isChangePlan
        ? true
        : existingSub.external_charge_id === chargeId &&
          existingSub.status === subscriptionStatus)
    ) {
      return {
        processed: true,
        subscriptionId: existingSub.id,
        transactionStatus: existingTx.status,
      };
    }
  } catch (err) {
    console.warn("[webhook/payment] findTransactionByExternalChargeId error", chargeId, err);
  }

  let subscription;
  try {
    subscription = await findSubscriptionById(subscriptionId);
  } catch (err) {
    console.error("[webhook/payment] findSubscriptionById error", subscriptionId, err);
    return { processed: false, subscriptionId, error: err?.message || "SUBSCRIPTION_LOOKUP_FAILED" };
  }

  if (!subscription) {
    console.warn("[webhook/payment] Subscription not found", subscriptionId);
    return { processed: false, subscriptionId, error: "SUBSCRIPTION_NOT_FOUND" };
  }

  // For change-plan success: load target package and validate amount against it.
  const amountMinor = event?.data?.amount;
  const currency = event?.data?.currency || "THB";
  let targetPackage = null;
  if (isChangePlan && isSuccess) {
    if (!targetPackageId) {
      console.warn("[webhook/payment] Missing targetPackageId for change-plan", {
        subscriptionId,
        chargeId,
        metadata,
      });
      return { processed: false, subscriptionId, error: "MISSING_TARGET_PACKAGE_ID" };
    }
    targetPackage = await prisma.package.findUnique({
      where: { id: targetPackageId },
    });
    if (!targetPackage) {
      console.warn("[webhook/payment] targetPackage not found for change-plan", {
        subscriptionId,
        chargeId,
        targetPackageId,
      });
      return { processed: false, subscriptionId, error: "TARGET_PACKAGE_NOT_FOUND" };
    }
  }

  // Validate amount from gateway matches our expected package price (anti-spoofing / data sanity).
  // Only enforce on success events (failed/cancelled may not include final amount depending on gateway).
  if (isSuccess) {
    const expectedPrice =
      isChangePlan && targetPackage
        ? targetPackage.price?.toString?.() ?? String(targetPackage.price ?? "")
        : subscription?.package?.price?.toString?.() ??
          String(subscription?.package?.price ?? "");
    const expectedMinor = amountFromMajorToMinor(expectedPrice, currency);
    const receivedMinor = Number.isFinite(Number(amountMinor))
      ? Number(amountMinor)
      : null;
    if (expectedMinor != null && receivedMinor != null && expectedMinor !== receivedMinor) {
      console.warn("[webhook/payment] Amount mismatch", {
        subscriptionId,
        chargeId,
        expectedMinor,
        receivedMinor,
        currency,
      });
      return { processed: false, subscriptionId, error: "AMOUNT_MISMATCH" };
    }
  }

  // กำหนดช่วงเวลาเริ่ม/หมดอายุเฉพาะกรณีชำระสำเร็จ และ subscription เดิมยังไม่ ACTIVE
  let nextStartDate = subscription.start_date;
  let nextEndDate = subscription.end_date;
  let nextPackageId = null;
  if (isSuccess) {
    if (isChangePlan && targetPackage) {
      const period = calculateSubscriptionPeriodFromPackage(targetPackage, paidAt);
      nextStartDate = period.startDate;
      nextEndDate = period.endDate;
      nextPackageId = targetPackage.id;
    } else if (subscription.status !== SubscriptionStatus.ACTIVE) {
      const period = calculateSubscriptionPeriod(subscription, paidAt);
      nextStartDate = period.startDate;
      nextEndDate = period.endDate;
    }
  }

  const amountMajor = amountFromMinorToMajor(amountMinor, currency);

  try {
    await upsertTransactionFromWebhook({
      userSubscriptionId: subscription.id,
      externalChargeId: chargeId,
      amount: amountMajor,
      currency,
      gateway: GATEWAY_NAME,
      status: transactionStatus,
      paidAt,
    });
  } catch (err) {
    console.error("[webhook/payment] upsertTransactionFromWebhook error", chargeId, err);
    return {
      processed: false,
      subscriptionId,
      transactionStatus,
      error: err?.message || "TRANSACTION_UPDATE_FAILED",
    };
  }

  try {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        ...(subscriptionStatus ? { status: subscriptionStatus } : {}),
        ...(isSuccess
          ? {
              start_date: nextStartDate,
              end_date: nextEndDate,
              paid_at: paidAt,
              external_charge_id: chargeId,
              gateway: GATEWAY_NAME,
              ...(nextPackageId ? { package_id: nextPackageId } : {}),
            }
          : isChangePlan
            ? {
                // Failed/cancelled change-plan: keep user's current ACTIVE plan, but unlock for retry.
                external_charge_id: null,
              }
            : {
                start_date: nextStartDate,
                end_date: nextEndDate,
                external_charge_id: chargeId,
                paid_at: paidAt,
                gateway: GATEWAY_NAME,
              }),
      },
    });
  } catch (err) {
    console.error("[webhook/payment] UserSubscription update error", subscription.id, err);
    return {
      processed: true,
      subscriptionId,
      transactionStatus,
      error: err?.message || "SUBSCRIPTION_UPDATE_FAILED",
    };
  }

  return {
    processed: true,
    subscriptionId: subscription.id,
    transactionStatus,
  };
}
