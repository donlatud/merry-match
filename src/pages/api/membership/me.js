import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

// รวมรายการสิทธิ์ของแพ็กโดยให้ priority กับ package.details
// เพื่อให้หน้า /membership ใช้ข้อมูลที่เรียงลำดับได้ก่อน แล้วค่อย fallback ไป features เดิม
function getPackageFeatures(packageData) {
  if (!packageData) return [];

  const detailValues = Array.isArray(packageData.details)
    ? packageData.details.map((detail) => detail?.value).filter(Boolean)
    : [];

  if (detailValues.length > 0) return detailValues;

  return Array.isArray(packageData.features)
    ? packageData.features.filter(
        (feature) => typeof feature === "string" && feature.trim().length > 0,
      )
    : [];
}

/**
 * GET /api/membership/me
 * คืนสถานะ Merry Membership ปัจจุบันของ user
 *
 * Response 200:
 * {
 *   packageName: string | null,
 *   status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "FAILED" | null,
 *   expireAt: string | null, // ISO8601
 *   membership: {
 *     startDate: string | null,
 *     nextBillingDate: string | null,
 *     package: {
 *       id: number,
 *       name: string,
 *       price: string,
 *       currency: string,
 *       billingInterval: string,
 *       iconUrl: string | null,
 *       features: string[]
 *     } | null
 *   } | null
 * }
 */
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

    // ดึง subscription ปัจจุบันของ user พร้อม package และ detail package
    // เพื่อให้ API นี้ตอบได้ทั้ง field เดิม และข้อมูลสรุปสำหรับหน้า /membership
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        subscription: {
          include: {
            package: {
              include: {
                details: {
                  orderBy: { position: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      const err = new Error("PROFILE_NOT_FOUND");
      err.statusCode = 404;
      throw err;
    }

    let subscription = profile.subscription;

    // Lazy update: ถ้า status เป็น CANCELLED และ end_date ผ่านไปแล้ว ให้อัปเดตเป็น EXPIRED ใน DB
    // (ไม่ต้องใช้ cron; อัปเดตตอนมีคนเรียก API นี้)
    if (
      subscription?.id &&
      subscription.status === SubscriptionStatus.CANCELLED &&
      subscription.end_date
    ) {
      const end = subscription.end_date instanceof Date ? subscription.end_date : new Date(subscription.end_date);
      if (end.getTime() < Date.now()) {
        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        subscription = { ...subscription, status: SubscriptionStatus.EXPIRED };
      }
    }

    // ชุด field เดิม: คงไว้เพื่อไม่ให้กระทบ consumer เก่า เช่น usePackageSelection
    const packageName = subscription?.package?.name ?? null;
    const status = subscription?.status ?? null;
    const expireAt = subscription?.end_date
      ? subscription.end_date.toISOString()
      : null;

    // ชุด field ใหม่: เพิ่มสำหรับหน้า /membership
    // แยกไว้ใน object membership เพื่อไม่ชนกับ response shape เดิม
    // cancelledAt: มีค่าเมื่อ user กดยกเลิก (ยังใช้สิทธิ์ได้จนถึง end_date, status ยัง ACTIVE)
    const membership = subscription
      ? {
          startDate: subscription.start_date?.toISOString?.() ?? null,
          nextBillingDate: subscription.end_date?.toISOString?.() ?? null,
          cancelledAt: subscription.cancelled_at?.toISOString?.() ?? null,
          package: subscription.package
            ? {
                id: subscription.package.id,
                name: subscription.package.name,
                price:
                  subscription.package.price?.toString?.() ??
                  String(subscription.package.price ?? ""),
                currency: subscription.package.currency ?? "THB",
                billingInterval:
                  subscription.package.billing_interval ?? "month",
                iconUrl: subscription.package.icon_url ?? null,
                // features ถูก normalize ให้ frontend ใช้งานตรงๆ ได้ทันที
                features: getPackageFeatures(subscription.package),
              }
            : null,
        }
      : null;

    // ส่งทั้ง field เดิมและ field ใหม่พร้อมกัน
    // เพื่อให้หน้า payment ใช้ของเดิมต่อได้ และหน้า /membership ใช้ membership object เพิ่มได้
    return res.status(200).json({
      packageName,
      status,
      expireAt,
      membership,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
