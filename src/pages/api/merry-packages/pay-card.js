import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";
import { allowMethods } from "@/middlewares/method.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { getPaymentGatewayProvider } from "@/providers/paymentGatewayProvider";
import { validatePaymentRequest } from "@/services/package/subscriptionService";

const PENDING_SUBSCRIPTION_EXPIRE_HOURS = Number.parseInt(
  process.env.PENDING_SUBSCRIPTION_EXPIRE_HOURS || "24",
  10
);
const PENDING_SUBSCRIPTION_EXPIRE_MS =
  (Number.isFinite(PENDING_SUBSCRIPTION_EXPIRE_HOURS)
    ? PENDING_SUBSCRIPTION_EXPIRE_HOURS
    : 24) *
  60 *
  60 *
  1000;

/**
 * สร้าง response ฝั่ง success (ใช้ร่วมกับ pay-card)
 */
function buildSuccessPayload(pkg) {
  const startDate = new Date();
  const nextBilling = new Date(startDate);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  const amount = String(pkg.price ?? "");
  const features = Array.isArray(pkg.features)
    ? pkg.features
    : ["Merry more than a daily limited", "Up to 70 Merry per day"];
  return {
    success: true,
    packageName: pkg.name,
    amount,
    currency: pkg.currency ?? "THB",
    startDate: startDate.toISOString(),
    nextBillingDate: nextBilling.toISOString(),
    features,
  };
}

/**
 * POST /api/merry-packages/pay-card
 * ชำระด้วยบัตร: ใช้ PaymentGatewayProvider (mock = จำลอง, omise = เรียก API จริง)
 *
 * Body (JSON):
 * - subscriptionId: number (required)
 * - cardToken: string (required เมื่อ PAYMENT_GATEWAY=omise — token จาก Omise.js)
 * - success: boolean (optional, ใช้เมื่อ gateway=mock เพื่อจำลอง success/fail)
 * - targetPackageId: number (optional; ถ้ามีจะถือว่าเป็น change-plan)
 *
 * Response 200:
 * - success: true → { success: true, packageName, amount, currency, startDate, nextBillingDate, features }
 * - success: false → { success: false, message }
 */
export default async function handler(req, res) {
  try {
    allowMethods(["POST"])(req, res);
    await authMiddleware(req, res);

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!profile) {
      const err = new Error("PROFILE_NOT_FOUND");
      err.statusCode = 404;
      throw err;
    }

    const { subscriptionId, cardToken, targetPackageId } = req.body ?? {};

    const { subscription, pkg, isChangePlan } = await validatePaymentRequest({
      subscriptionId,
      targetPackageId,
      profileId: profile.id,
    });

    const amount = String(pkg.price ?? "");
    const currency = pkg.currency ?? "THB";
    const description = `MerryMatch ${pkg.name} 1 month`;

    if (!cardToken || typeof cardToken !== "string") {
      const err = new Error("MISSING_CARD_TOKEN");
      err.statusCode = 400;
      throw err;
    }

    const provider = getPaymentGatewayProvider();
    let chargeCustomerId = subscription.omise_customer_id || null;

    // Auto-subscription: ensure Omise customer exists (card only).
    // เราทำทั้ง first purchase และ change-plan เพื่อให้ recurring charges ผูกกับ customer ตัวเดียวกันได้
    // การสร้าง Omise subscription จะทำใน webhook โดยใช้ omise_customer_id ที่เซ็ตไว้
    if (!subscription?.omise_customer_id && typeof provider.createCustomer === "function") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const email = user?.email;
      if (email) {
        const customer = await provider.createCustomer({
          email,
          cardToken,
          description: `MerryMatch user ${userId}`,
        });
        if (customer?.id) {
          chargeCustomerId = customer.id;
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { omise_customer_id: customer.id },
          });
        }
      }
    }

    const chargeParams = {
      amount,
      currency,
      description,
      metadata: {
        subscriptionId: subscription.id,
        packageId: pkg.id,
        packageName: pkg.name,
        changePlan: isChangePlan,
        targetPackageId: isChangePlan ? pkg.id : undefined,
        autoRenew: !isChangePlan, // business rule: first purchase enables auto-renew by default
      },
    };

    const result = await provider.createCardCharge(
      chargeCustomerId
        ? { ...chargeParams, customerId: chargeCustomerId }
        : { ...chargeParams, cardToken }
    );

    // For non-failed charges, lock the subscription to this charge and create a pending transaction.
    // บันทึก package_id ลง payment_transactions เพื่อใช้แสดง billing history 
    if (result?.id && result.status !== "failed") {
      const chargeId = result.id;
      const gateway = "omise";
      await prisma.$transaction([
        prisma.userSubscription.update({
          where: { id: subscription.id },
          data: {
            external_charge_id: chargeId,
            gateway,
          },
        }),
        prisma.paymentTransaction.upsert({
          where: { external_charge_id: String(chargeId) },
          update: {},
          create: {
            user_subscription_id: subscription.id,
            amount,
            currency,
            gateway,
            external_charge_id: String(chargeId),
            status: PaymentTransactionStatus.PENDING,
            paid_at: null,
            package_id: pkg.id, // แพ็กที่ชำระ ณ ตอนสร้าง transaction (first purchase / change-plan)
          },
        }),
      ]);
    }

    if (result.status === "successful") {
      // อัปเดต subscription + transaction ทันทีเมื่อชำระสำเร็จแบบ synchronous (ถ้า webhook มาทีหลังจะอัปเดตซ้ำด้วยค่าเดียวกัน — ไม่ขัดแย้ง)
      const chargeId = result.id;
      const paidAt = new Date();
      const startDate = paidAt;
      const endDate = new Date(paidAt);
      const interval = String(pkg.billing_interval || "month").toLowerCase();
      if (interval === "year") endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      await prisma.$transaction([
        prisma.userSubscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            auto_renew: true,
            cancelled_at: null,
            start_date: startDate,
            end_date: endDate,
            paid_at: paidAt,
            package_id: pkg.id,
            external_charge_id: chargeId,
            gateway: "omise",
          },
        }),
        prisma.paymentTransaction.updateMany({
          where: { external_charge_id: String(chargeId) },
          data: {
            status: PaymentTransactionStatus.PAID,
            paid_at: paidAt,
          },
        }),
      ]);

      return res.status(200).json(buildSuccessPayload(pkg));
    }

    const message =
      result.raw?.failure_message ||
      result.raw?.message ||
      "Payment failed or was declined.";
    return res.status(200).json({
      success: false,
      message,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}