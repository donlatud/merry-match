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

    // Auto-subscription: ensure Omise customer exists (card only).
    // We do this for both first purchase and change-plan so future recurring charges can be linked.
    // Subscription creation will happen after charge success (in webhook) using stored omise_customer_id.
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
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { omise_customer_id: customer.id },
          });
        }
      }
    }

    const result = await provider.createCardCharge({
      amount,
      currency,
      description,
      cardToken,
      metadata: {
        subscriptionId: subscription.id,
        packageId: pkg.id,
        packageName: pkg.name,
        changePlan: isChangePlan,
        targetPackageId: isChangePlan ? pkg.id : undefined,
        autoRenew: !isChangePlan, // business rule: first purchase enables auto-renew by default
      },
    });

    // For non-failed charges, lock the subscription to this charge and create a pending transaction.
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
          },
        }),
      ]);
    }

    if (result.status === "successful") {
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
