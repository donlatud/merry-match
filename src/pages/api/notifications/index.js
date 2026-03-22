import { notificationsController } from "@/controllers/notifications/notifications.controller";

/**
 * GET /api/notifications?limit=... — รายการ noti ของ user
 * PATCH /api/notifications — mark seen / read (action, id, roomId)
 * แถวใน notifications ถูกสร้างโดย Supabase trigger จาก swipes + messages
 */
export default async function handler(req, res) {
  return notificationsController.handleNotifications(req, res);
}
