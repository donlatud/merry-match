import { prisma } from "@/lib/prisma";
import { PaymentTransactionStatus } from "@prisma/client";
import { allowMethods } from "@/middlewares/method.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { getPaymentGatewayProvider } from "@/providers/paymentGatewayProvider";
import { validatePaymentRequest } from "@/services/package/subscriptionService";

const QR_RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.QR_RATE_LIMIT_WINDOW_MS || "30000",
  10
);
const QR_RATE_LIMIT_MAX = Number.parseInt(process.env.QR_RATE_LIMIT_MAX || "3", 10);
const QR_RATE_LIMIT_WINDOW =
  Number.isFinite(QR_RATE_LIMIT_WINDOW_MS) && QR_RATE_LIMIT_WINDOW_MS > 0
    ? QR_RATE_LIMIT_WINDOW_MS
    : 30000;
const QR_RATE_LIMIT_LIMIT =
  Number.isFinite(QR_RATE_LIMIT_MAX) && QR_RATE_LIMIT_MAX > 0 ? QR_RATE_LIMIT_MAX : 3;

/** @type {Map<string, { count: number; resetAt: number }>} */
const qrRateLimitBuckets = new Map();

/**
 * POST /api/merry-packages/pay-qr
 * สร้าง QR charge สำหรับ subscription ที่เลือก (ใช้ mock หรือ Omise ผ่าน PaymentGatewayProvider)
 *
 * Body (JSON): { subscriptionId: number }
 *
 * Response 200:
 * { success: true, qrImageUrl, status, chargeId }
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

    // Rate limit: prevent generating too many QR codes in a short time.
    // Note: in-memory only (per server instance). Good enough for dev / single-node deployments.
    const rateKey = `profile:${profile.id}`;
    const now = Date.now();
    const bucket = qrRateLimitBuckets.get(rateKey);
    if (!bucket || now >= bucket.resetAt) {
      qrRateLimitBuckets.set(rateKey, { count: 1, resetAt: now + QR_RATE_LIMIT_WINDOW });
    } else if (bucket.count >= QR_RATE_LIMIT_LIMIT) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      const err = new Error("RATE_LIMITED");
      err.statusCode = 429;
      throw err;
    } else {
      bucket.count += 1;
    }

    const { subscriptionId, targetPackageId } = req.body ?? {};

    const { subscription, pkg, isChangePlan } = await validatePaymentRequest({
      subscriptionId,
      targetPackageId,
      profileId: profile.id,
    });

    const amount = String(pkg.price ?? "");
    const currency = pkg.currency ?? "THB";

    const provider = getPaymentGatewayProvider();
    if (!provider.createQrCharge) {
      const err = new Error("QR_NOT_SUPPORTED_FOR_CURRENT_GATEWAY");
      err.statusCode = 500;
      throw err;
    }

    const description = `MerryMatch ${pkg.name} 1 month`;
    const qrCharge = await provider.createQrCharge({
      amount,
      currency,
      description,
      metadata: {
        subscriptionId: subscription.id,
        packageId: pkg.id,
        packageName: pkg.name,
        changePlan: isChangePlan,
        targetPackageId: isChangePlan ? pkg.id : undefined,
      },
    });

    // Lock the subscription to this charge and create a pending transaction.
    // บันทึก package_id ลง payment_transactions เพื่อใช้แสดง billing history
    const chargeId = qrCharge.id;
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

    return res.status(200).json({
      success: true,
      chargeId,
      status: qrCharge.status,
      qrImageUrl: qrCharge.qrImageUrl,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}

