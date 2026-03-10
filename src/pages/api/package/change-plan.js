import { allowMethods } from "@/middlewares/method.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { prepareChangePlan } from "@/services/package/subscriptionService";

/**
 * POST /api/package/change-plan
 * เปลี่ยน Merry Package (upgrade/downgrade) สำหรับ user ที่มี subscription ACTIVE
 *
 * Body (JSON):
 * { "targetPackageId": number }
 *
 * Response 200:
 * {
 *   mode: "change-plan",
 *   subscriptionId: number,
 *   currentPackage: { id, name, price, currency, billing_interval, features },
 *   targetPackage: { id, name, price, currency, billing_interval, features },
 *   amount: "199.00",
 *   currency: "THB"
 * }
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

    const { targetPackageId } = req.body ?? {};
    const parsedTargetPackageId =
      typeof targetPackageId === "string"
        ? Number.parseInt(targetPackageId, 10)
        : targetPackageId;

    if (!Number.isInteger(parsedTargetPackageId) || parsedTargetPackageId <= 0) {
      const err = new Error("INVALID_BODY");
      err.statusCode = 400;
      throw err;
    }

    const payload = await prepareChangePlan({
      userId,
      targetPackageId: parsedTargetPackageId,
    });

    return res.status(200).json(payload);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}

