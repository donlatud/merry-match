// src/controllers/matching/matches.controller.js
import { authMiddleware } from "@/middlewares/matching/auth.middleware";
import { matchesService } from "@/services/matching/matches.service";

export const matchesController = {
  /**
   * GET /api/matching/matches
   * ดึงรายการ Matches ทั้งหมดของ User
   */
  async getMatches(req, res) {
    try {
      // ตรวจสอบ HTTP Method
      authMiddleware.validateMethod(req, ["GET"]);

      // ตรวจสอบ Authentication
      const user = await authMiddleware.authenticate(req);

      // เรียก Service Layer
      const result = await matchesService.getUserMatches(user.id);

      // ส่ง Response สำเร็จ
      return res.status(200).json({
        success: true,
        data: result,
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
    console.error("[Matches Controller Error]:", error.message);

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

    // Default Server Error
    return res.status(500).json({ error: "Internal server error" });
  }
};