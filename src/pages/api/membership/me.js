import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

/**
 * GET /api/membership/me
 * คืนสถานะ Merry Membership ปัจจุบันของ user
 *
 * Response 200:
 * {
 *   packageName: string | null,
 *   status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "FAILED" | null,
 *   expireAt: string | null // ISO8601
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

    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        subscription: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!profile) {
      const err = new Error("PROFILE_NOT_FOUND");
      err.statusCode = 404;
      throw err;
    }

    const subscription = profile.subscription;

    const packageName = subscription?.package?.name ?? null;
    const status = subscription?.status ?? null;
    const expireAt = subscription?.end_date
      ? subscription.end_date.toISOString()
      : null;

    return res.status(200).json({
      packageName,
      status,
      expireAt,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}

