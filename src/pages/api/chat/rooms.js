import { roomController } from "@/controllers/chat/room.controller";
import { authMiddleware } from "@/middlewares/matching/auth.middleware";

export default async function handler(req, res) {
  try {
    // 1. ตรวจสอบสิทธิ์ผ่าน Middleware (ตัวเดียวกับที่ใช้ใน Swipe)
    const user = await authMiddleware.authenticate(req);

    // 2. แจกจ่ายงานตาม Method
    switch (req.method) {
      case "GET":
        return await roomController.getRooms(req, res, user);
      case "POST":
        return await roomController.createRoom(req, res, user);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    return res.status(401).json({ error: error.message || "Unauthorized" });
  }
}