import { meController } from "@/controllers/me/me.controller";

/**
 * GET /api/me/profile-image — คืน id + profile_image_url (รูปแรกของ profile)
 */
export default async function handler(req, res) {
  return meController.getProfileImage(req, res);
}
