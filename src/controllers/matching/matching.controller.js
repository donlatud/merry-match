// src/controllers/matching/matching.controller.js

import { authMiddleware } from "@/middlewares/matching/auth.middleware";
import { matchingService } from "@/services/matching/matching.service";

export const matchingController = {
  /**
   * GET /api/matching/profiles
   * ดึงรายการโปรไฟล์สำหรับการ Matching
   */
  async getProfiles(req, res) {
    try {
      // ตรวจสอบ HTTP Method
      authMiddleware.validateMethod(req, ["GET"]);

      // ตรวจสอบ Authentication
      const user = await authMiddleware.authenticate(req);

      // ดึงค่า Query Parameters
      const filters = {
        genders: req.query.genders,
        ageMin: Number(req.query.ageMin) || 18,
        ageMax: Number(req.query.ageMax) || 80,
      };

      // เรียก Service Layer
      const result = await matchingService.getMatchingProfiles(user.id, filters);

      // ส่ง Response สำเร็จ
      return res.status(200).json(result);

    } catch (error) {
      // จัดการ Error
      return this.handleError(res, error);
    }
  },

  /**
   * จัดการ Error Response
   */
  handleError(res, error) {
    console.error("[Controller Error]:", error.message);

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