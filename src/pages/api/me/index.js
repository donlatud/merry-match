import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { findUserById } from "@/repositories/user.repository";

/**
 * GET /api/me – คืนข้อมูล user ปัจจุบันจาก DB (ใช้หลังมี Supabase session)
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

    const user = await findUserById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json(user);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
