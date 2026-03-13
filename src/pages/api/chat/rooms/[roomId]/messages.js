import { messageController } from "@/controllers/chat/message.controller";
import { authMiddleware } from "@/middlewares/matching/auth.middleware";

export default async function handler(req, res) {
  try {
    const user = await authMiddleware.authenticate(req);
    
    const allowedMethods = ["GET", "POST", "PATCH"];
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    return await messageController.handleMessages(req, res, user);
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}