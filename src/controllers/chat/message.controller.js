import { messageService } from "@/services/chat/message.service";
import { messageRepository } from "@/repositories/chat/message.repository";
import { profileRepository } from "@/repositories/matching/profile.repository";

export const messageController = {
  async handleMessages(req, res, user) {
    const { roomId } = req.query;
    const myProfile = await profileRepository.findByUserId(user.id);
    if (!myProfile) return res.status(404).json({ error: "Profile not found" });

    try {
      if (req.method === "GET") {
        const data = await messageService.getRoomMessages(roomId, myProfile.id);
        return res.status(200).json({ success: true, data });
      }

      if (req.method === "POST") {
        const data = await messageService.sendMessage(roomId, myProfile.id, req.body);
        return res.status(201).json({ success: true, data });
      }

      if (req.method === "PATCH") {
        await messageRepository.markAsRead(roomId, myProfile.id);
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error("[Message Controller Error]", error.message);
      if (error.message === "ROOM_NOT_FOUND") return res.status(404).json({ error: "Room not found" });
      if (error.message === "FORBIDDEN") return res.status(403).json({ error: "Forbidden" });
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};