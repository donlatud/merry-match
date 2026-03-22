import { meController } from "@/controllers/me/me.controller";

/**
 * GET /api/me — คืนข้อมูล user ที่ login: profile + subscription (พร้อม package และ details)
 * ใช้สำหรับ NavBar / MemberNavDropdown และเตรียมใช้กรอง noti ตาม subscription
 */
export default async function handler(req, res) {
  return meController.getCurrentUser(req, res);
}
