// src/controllers/matching/swipe.controller.js
import { authMiddleware } from "@/middlewares/matching/auth.middleware";
import { swipeService } from "@/services/matching/swipe.service";

export const swipeController = {
  /**
   * POST /api/matching/swipe
   * สร้าง Swipe ใหม่ (LIKE / PASS)
   */
  async createSwipe(req, res) {
    try {
      // ตรวจสอบ HTTP Method
      authMiddleware.validateMethod(req, ["POST"]);

      // ตรวจสอบ Authentication
      const user = await authMiddleware.authenticate(req);

      // Validate Request Body
      const { receiverId, status } = req.body;
      
      if (!receiverId || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["LIKE", "DISLIKE"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be LIKE or DISLIKE" });
      }

      // เรียก Service Layer
      const result = await swipeService.createSwipe({
        userId: user.id,
        receiverId,
        status,
      });

      // ส่ง Response สำเร็จ
      return res.status(200).json({
        success: true,
        isMatch: result.isMatch,
        data: result.swipe,
      });

    } catch (error) {
      // จัดการ Error
      return this.handleError(res, error);
    }
  },

  /**
   * จัดการ Error Response
   */
  handleError(res, error) {
    console.error("[Swipe Controller Error]:", error.message);

    // Error Types
    if (error.message.includes("Method") && error.message.includes("not allowed")) {
      return res.status(405).json({ error: error.message });
    }

    if (error.message.includes("Token") || error.message.includes("Unauthorized")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("Already swiped")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("required")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === "MEMBERSHIP_REQUIRED" || error.statusCode === 403) {
      return res.status(403).json({ error: "Membership required" });
    }

    // Default Server Error
    return res.status(500).json({ error: "Internal server error" });
  }
};