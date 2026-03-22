import { createPendingSubscription } from "@/services/package/subscriptionService";
import { allowMethods } from "@/middlewares/method.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

/**
 * POST /api/package/checkout
 * Create PENDING Subscription for the authenticated user and given packageId.
 * userId is taken from the auth token (Bearer), not from the body.
 *
 * Body (JSON):
 * { "packageId": number }
 *
 * Response:
 * 201 { subscriptionId, amount, currency, packageName }
 *
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
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

    const { packageId } = req.body || {};

    const parsedPackageId =
      typeof packageId === "string" ? Number.parseInt(packageId, 10) : packageId;

    if (!Number.isInteger(parsedPackageId) || parsedPackageId <= 0) {
      const err = new Error("INVALID_BODY");
      err.statusCode = 400;
      throw err;
    }

    const result = await createPendingSubscription({
      userId,
      packageId: parsedPackageId,
    });

    return res.status(201).json(result);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}

