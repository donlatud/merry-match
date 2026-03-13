import { roomService } from "@/services/chat/room.service";
import { profileRepository } from "@/repositories/matching/profile.repository"; // สมมติว่ามีอยู่แล้ว

export const roomController = {
  async getRooms(req, res, user) {
    try {
      const myProfile = await profileRepository.findByUserId(user.id);
      if (!myProfile) return res.status(404).json({ error: "Profile not found" });

      const data = await roomService.getAllRooms(myProfile.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("[Room Controller GET]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async createRoom(req, res, user) {
    try {
      const { partnerId } = req.body;
      if (!partnerId) return res.status(400).json({ error: "partnerId is required" });

      const myProfile = await profileRepository.findByUserId(user.id);
      const room = await roomService.createOrGetRoom(myProfile.id, partnerId);
      
      return res.status(200).json({ success: true, data: room });
    } catch (error) {
      console.error("[Room Controller POST]", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};