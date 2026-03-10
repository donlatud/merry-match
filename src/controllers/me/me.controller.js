import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { meService } from "@/services/me/me.service";


export const meController = {
  /**
   * GET /api/me — คืนข้อมูล current user (profile + subscription)
   */
  async getCurrentUser(req, res) {
    try {
      allowMethods(["GET"])(req, res);
      await authMiddleware(req, res);

      const userId = req.user?.id;
      if (!userId) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      const result = await meService.getCurrentUser(userId);
      if (!result?.profile) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
      }
      return res.status(200).json(result);
    } catch (err) {
      return errorMiddleware(err, req, res);
    }
  },

  /**
   * GET /api/me/profile-image — คืน profile id + URL รูปแรก
   */
  async getProfileImage(req, res) {
    try {
      allowMethods(["GET"])(req, res);
      await authMiddleware(req, res);

      const userId = req.user?.id;
      if (!userId) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      const result = await meService.getProfileImage(userId);
      return res.status(200).json(result);
    } catch (err) {
      return errorMiddleware(err, req, res);
    }
  },
};
