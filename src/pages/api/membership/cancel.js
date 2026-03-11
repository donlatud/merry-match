import { allowMethods } from "@/middlewares/method.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { cancelPackage } from "@/services/package/subscriptionService";

/**
 * POST /api/membership/cancel
 * ยกเลิกแพ็กเกจปัจจุบัน (cancel at period end): user ยังใช้สิทธิ์ได้จนถึง end_date
 * ต้องมี subscription ACTIVE และ end_date ยังไม่หมด
 *
 * Response 200:
 * - { ok: true, cancelledAt: string, endDate: string | null }
 *
 * Errors: 404 SUBSCRIPTION_NOT_FOUND, 409 SUBSCRIPTION_NOT_ACTIVE
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

    const result = await cancelPackage(userId);
    return res.status(200).json(result);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
