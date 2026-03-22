import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { notificationsService } from "@/services/notifications/notifications.service";

export const notificationsController = {
  /**
   * ตัวจัดการ request ของ /api/notifications — GET (รายการ noti) หรือ PATCH (mark read/seen)
   */
  async handleNotifications(req, res) {
    try {
      allowMethods(["GET", "PATCH"])(req, res);
      await authMiddleware(req, res);

      const userId = req.user?.id;
      if (!userId) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      if (req.method === "GET") {
        const result = await notificationsService.getItems(
          userId,
          req.query
        );
        return res.status(200).json(result);
      }

      if (req.method === "PATCH") {
        const result = await notificationsService.patch(userId, req.body);
        if (result.status === 400) {
          return res.status(400).json({ error: result.error });
        }
        return res.status(200).json({ ok: true });
      }
    } catch (err) {
      return errorMiddleware(err, req, res);
    }
  },
};
