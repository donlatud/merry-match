import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";
import {
  findSubscriptionById,
  findSubscriptionByOmiseSubscriptionId,
} from "@/repositories/package/subscriptionRepository";
import {
  findTransactionByExternalChargeId,
  upsertTransactionFromWebhook,
} from "@/repositories/package/paymentTransactionRepository";
import {
  amountFromMajorToMinor,
  amountFromMinorToMajor,
} from "@/lib/currencyHelpers";
import { getPaymentGatewayProvider } from "@/providers/paymentGatewayProvider";

const GATEWAY_NAME = "omise";

/**
 * เช็กว่า event นี้คือชำระสำเร็จหรือไม่ (จาก type หรือ data.paid)
 */
function isSuccessEvent(event) {
  const type = (event?.type || "").toLowerCase();
  if (
    type.includes("complete") ||
    type.includes("capture") ||
    type === "charge.pay"
  )
    return true;
  if (type.includes("fail") || type.includes("reverse")) return false;
  return event?.data?.paid === true;
}

/**
 * เช็กว่า event นี้คือกรณียกเลิก/หมดอายุ (treat เป็น CANCELLED)
 */
function isCancelledEvent(event) {
  const type = (event?.type || "").toLowerCase();
  const status = (event?.data?.status || "").toLowerCase();

  if (
    type.includes("cancel") ||
    type.includes("reverse") ||
    type.includes("expire")
  )
    return true;
  if (
    status === "canceled" ||
    status === "cancelled" ||
    status === "reversed" ||
    status === "expired"
  ) {
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

  const interval = (
    subscription?.package?.billing_interval || "month"
  ).toLowerCase();
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
 * - หา UserSubscription จาก metadata.subscriptionId (our id) หรือ metadata.omise_subscription_id (map ไปยัง UserSubscription)
 * - รองรับ charge จาก first purchase, change-plan และ Omise subscription (recurring)
 * - สร้างหรืออัปเดต PaymentTransaction (status PAID/FAILED)
 * - อัปเดต UserSubscription (status, start_date, end_date, paid_at, external_charge_id)
 * - สำหรับ recurring fail: บันทึก FAILED transaction แต่คง status ACTIVE จนถึง end_date
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
  const omiseSubscriptionId =
    metadata.omise_subscription_id ?? metadata.omiseSubscriptionId ?? null;

  if (!chargeId) {
    console.warn(
      "[webhook/payment] Missing chargeId in event",
      event?.id,
      event?.type,
    );
    return { processed: false, error: "MISSING_CHARGE_ID" };
  }

  const hasOurSubscriptionId =
    Number.isInteger(subscriptionId) && subscriptionId > 0;
  const hasOmiseSubscriptionId =
    typeof omiseSubscriptionId === "string" &&
    omiseSubscriptionId.trim().length > 0;

  if (!hasOurSubscriptionId && !hasOmiseSubscriptionId) {
    console.warn(
      "[webhook/payment] Missing subscriptionId and omise_subscription_id in metadata",
      event?.id,
      metadata,
    );
    return { processed: false, error: "MISSING_SUBSCRIPTION_ID" };
  }

  const isChangePlan = parseBool(metadata.changePlan ?? metadata.change_plan);
  const targetPackageId = parseIntOrNull(
    metadata.targetPackageId ?? metadata.target_package_id,
  );

  let subscription = null;
  try {
    if (hasOurSubscriptionId) {
      subscription = await findSubscriptionById(subscriptionId);
    }
    if (!subscription && hasOmiseSubscriptionId) {
      subscription =
        await findSubscriptionByOmiseSubscriptionId(omiseSubscriptionId);
    }
  } catch (err) {
    console.error("[webhook/payment] Subscription lookup error", err);
    return {
      processed: false,
      error: err?.message || "SUBSCRIPTION_LOOKUP_FAILED",
    };
  }

  if (!subscription) {
    console.warn("[webhook/payment] Subscription not found", {
      subscriptionId: hasOurSubscriptionId ? subscriptionId : null,
      omiseSubscriptionId: hasOmiseSubscriptionId ? omiseSubscriptionId : null,
    });
    return { processed: false, error: "SUBSCRIPTION_NOT_FOUND" };
  }

  const resolvedSubscriptionId = subscription.id;
  const isRecurringCharge =
    hasOmiseSubscriptionId ||
    metadata.source === "subscription" ||
    parseBool(metadata.recurring);

  const isSuccess = isSuccessEvent(event);
  const isCancelled = !isSuccess && isCancelledEvent(event);

  const transactionStatus = isSuccess
    ? PaymentTransactionStatus.PAID
    : PaymentTransactionStatus.FAILED;

  // For change-plan: do NOT downgrade the user's membership on failed/cancelled payments.
  // For recurring charge fail: keep ACTIVE until end_date (only record FAILED transaction).
  const subscriptionStatus = isSuccess
    ? SubscriptionStatus.ACTIVE
    : isChangePlan
      ? null
      : isRecurringCharge
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
      existingTx.user_subscription_id === resolvedSubscriptionId &&
      existingTx.status === transactionStatus &&
      (isChangePlan || isRecurringCharge
        ? true
        : existingSub.external_charge_id === chargeId &&
          (subscriptionStatus == null ||
            existingSub.status === subscriptionStatus))
    ) {
      return {
        processed: true,
        subscriptionId: existingSub.id,
        transactionStatus: existingTx.status,
      };
    }
  } catch (err) {
    console.warn(
      "[webhook/payment] findTransactionByExternalChargeId error",
      chargeId,
      err,
    );
  }

  // For change-plan success: load target package and validate amount against it.
  const amountMinor = event?.data?.amount;
  const currency = event?.data?.currency || "THB";
  let targetPackage = null;
  if (isChangePlan && isSuccess) {
    if (!targetPackageId) {
      console.warn(
        "[webhook/payment] Missing targetPackageId for change-plan",
        {
          subscriptionId: resolvedSubscriptionId,
          chargeId,
          metadata,
        },
      );
      return {
        processed: false,
        subscriptionId: resolvedSubscriptionId,
        error: "MISSING_TARGET_PACKAGE_ID",
      };
    }
    targetPackage = await prisma.package.findUnique({
      where: { id: targetPackageId },
    });
    if (!targetPackage) {
      console.warn(
        "[webhook/payment] targetPackage not found for change-plan",
        {
          subscriptionId: resolvedSubscriptionId,
          chargeId,
          targetPackageId,
        },
      );
      return {
        processed: false,
        subscriptionId: resolvedSubscriptionId,
        error: "TARGET_PACKAGE_NOT_FOUND",
      };
    }
  }

  // Validate amount from gateway matches our expected package price (anti-spoofing / data sanity).
  // Only enforce on success events (failed/cancelled may not include final amount depending on gateway).
  if (isSuccess) {
    const expectedPrice =
      isChangePlan && targetPackage
        ? (targetPackage.price?.toString?.() ??
          String(targetPackage.price ?? ""))
        : (subscription?.package?.price?.toString?.() ??
          String(subscription?.package?.price ?? ""));
    const expectedMinor = amountFromMajorToMinor(expectedPrice, currency);
    const receivedMinor = Number.isFinite(Number(amountMinor))
      ? Number(amountMinor)
      : null;
    if (
      expectedMinor != null &&
      receivedMinor != null &&
      expectedMinor !== receivedMinor
    ) {
      console.warn("[webhook/payment] Amount mismatch", {
        subscriptionId: resolvedSubscriptionId,
        chargeId,
        expectedMinor,
        receivedMinor,
        currency,
      });
      return {
        processed: false,
        subscriptionId: resolvedSubscriptionId,
        error: "AMOUNT_MISMATCH",
      };
    }
  }

  // กำหนดช่วงเวลาเริ่ม/หมดอายุ: ชำระสำเร็จ และ (first/change-plan หรือ recurring renewal)
  let nextStartDate = subscription.start_date;
  let nextEndDate = subscription.end_date;
  let nextPackageId = null;
  if (isSuccess) {
    if (isChangePlan && targetPackage) {
      const period = calculateSubscriptionPeriodFromPackage(
        targetPackage,
        paidAt,
      );
      nextStartDate = period.startDate;
      nextEndDate = period.endDate;
      nextPackageId = targetPackage.id;
    } else if (
      subscription.status !== SubscriptionStatus.ACTIVE ||
      isRecurringCharge
    ) {
      const period = calculateSubscriptionPeriod(subscription, paidAt);
      nextStartDate = period.startDate;
      nextEndDate = period.endDate;
    }
  }

  const amountMajor = amountFromMinorToMajor(amountMinor, currency);

  // Auto-subscription rule:
  // - On first purchase success (non-change-plan): set auto_renew = true and create Omise subscription if possible.
  // - On recurring charges: keep auto_renew as-is (should remain true until cancelled).
  // - On change-plan success: if auto_renew is true, switch Omise subscription to target plan
  //   by creating a new subscription then cancelling the old one.
  let nextAutoRenew = null;
  let nextCancelledAt = undefined;
  let createdOmiseSubscriptionId = null;
  if (isSuccess && !isChangePlan && !isRecurringCharge) {
    nextAutoRenew = true;
    nextCancelledAt = null;

    const customerId = subscription.omise_customer_id;
    const existingSubId = subscription.omise_subscription_id;
    const planId = subscription?.package?.omise_plan_id?.trim() || null;

    if (customerId && !existingSubId && planId) {
      try {
        const provider = getPaymentGatewayProvider();
        if (typeof provider.createSubscription === "function") {
          const created = await provider.createSubscription({
            customerId,
            planId,
            metadata: {
              subscriptionId: String(resolvedSubscriptionId),
              source: "subscription",
            },
          });
          createdOmiseSubscriptionId = created?.id || null;
        }
      } catch (e) {
        console.warn(
          "[webhook/payment] createSubscription failed",
          resolvedSubscriptionId,
          e?.message,
        );
      }
    }
  }

  // Change-plan success: ตั้ง auto_renew = true และล้าง cancelled_at (สมัคร/เปลี่ยนแผนใหม่ = เปิดต่ออายุอัตโนมัติ).
  // จากนั้นถ้า subscription เดิมมี auto_renew = true จะสร้าง Omise subscription สำหรับแพ็กใหม่ และยกเลิกของเก่า.
  if (isSuccess && isChangePlan && !isRecurringCharge) {
    nextAutoRenew = true;
    nextCancelledAt = null;
  }

  if (isSuccess && isChangePlan && targetPackage && !isRecurringCharge) {
    const shouldAutoRenew = subscription.auto_renew === true;
    const customerId = subscription.omise_customer_id;
    const oldSubId = subscription.omise_subscription_id;
    const newPlanId = targetPackage?.omise_plan_id?.trim() || null;

    if (shouldAutoRenew && customerId && newPlanId) {
      try {
        const provider = getPaymentGatewayProvider();
        if (typeof provider.createSubscription === "function") {
          const created = await provider.createSubscription({
            customerId,
            planId: newPlanId,
            metadata: {
              subscriptionId: String(resolvedSubscriptionId),
              source: "subscription",
            },
          });
          const newSubId = created?.id || null;
          if (newSubId) {
            createdOmiseSubscriptionId = newSubId;
            if (oldSubId && typeof provider.cancelSubscription === "function") {
              try {
                await provider.cancelSubscription(oldSubId);
              } catch (e) {
                console.warn(
                  "[webhook/payment] cancel old subscription failed",
                  resolvedSubscriptionId,
                  oldSubId,
                  e?.message,
                );
              }
            }
          }
        }
      } catch (e) {
        console.warn(
          "[webhook/payment] createSubscription for change-plan failed",
          resolvedSubscriptionId,
          e?.message,
        );
      }
    }
  }

  // package_id สำหรับ billing history: จาก metadata (charge จาก pay-card/pay-qr) หรือ subscription (recurring)
  const packageId =
    parseIntOrNull(metadata.packageId ?? metadata.package_id) ??
    subscription?.package_id ??
    subscription?.package?.id ??
    null;

  try {
    await upsertTransactionFromWebhook({
      userSubscriptionId: subscription.id,
      externalChargeId: chargeId,
      amount: amountMajor,
      currency,
      gateway: GATEWAY_NAME,
      status: transactionStatus,
      paidAt,
      packageId,
    });
  } catch (err) {
    console.error(
      "[webhook/payment] upsertTransactionFromWebhook error",
      chargeId,
      err,
    );
    return {
      processed: false,
      subscriptionId: resolvedSubscriptionId,
      transactionStatus,
      error: err?.message || "TRANSACTION_UPDATE_FAILED",
    };
  }

  try {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        ...(subscriptionStatus ? { status: subscriptionStatus } : {}),
        ...(nextAutoRenew != null ? { auto_renew: nextAutoRenew } : {}),
        ...(nextCancelledAt !== undefined
          ? { cancelled_at: nextCancelledAt }
          : {}),
        ...(createdOmiseSubscriptionId
          ? { omise_subscription_id: createdOmiseSubscriptionId }
          : {}),
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
    console.error(
      "[webhook/payment] UserSubscription update error",
      subscription.id,
      err,
    );
    return {
      processed: true,
      subscriptionId: resolvedSubscriptionId,
      transactionStatus,
      error: err?.message || "SUBSCRIPTION_UPDATE_FAILED",
    };
  }

  return {
    processed: true,
    subscriptionId: resolvedSubscriptionId,
    transactionStatus,
  };
}
