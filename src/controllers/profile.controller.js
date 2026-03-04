import { findProfileById, toPublicProfileJson } from "@/services/profile.service";

/**
 * GET /api/profile/[id]
 * Public profile view by profile id
 */
export const getProfileByIdController = async (req, res) => {
  const { id } = req.query;
  const profile = await findProfileById(id);
  const json = toPublicProfileJson(profile);
  return res.status(200).json(json);
};

