import { errorMiddleware } from "@/middlewares/error.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { validateProfileId } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { getProfileByIdController } from "@/controllers/profile.controller";
import { prisma } from "@/lib/prisma";
import { createProfileHobbies } from "@/repositories/profileHobbyRepository";
import { createProfileImages } from "@/repositories/profileImageRepository";

export default async function handler(req, res) {
  try {
    allowMethods(["GET", "PUT"])(req, res);
    validateProfileId(req);

    if (req.method === "GET") {
      await asyncHandler(getProfileByIdController)(req, res);
      return;
    }

    // PUT /api/profile/[id] — update owner profile
    const { id } = req.query;
    const profileId = Array.isArray(id) ? id[0] : id;

    const existingProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, user_id: true },
    });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const {
      name,
      birthday,
      location,
      city,
      username,
      email, // currently read-only on UI, kept for future use
      sexualIdentity,
      sexualPreference,
      racialPreference,
      meetingInterest,
      about,
      interests = [],
      images = [],
    } = req.body || {};

    const profileData = {
      full_name: name?.trim() ?? "",
      location: location?.trim() ?? "",
      city: city?.trim() ?? "",
      gender: sexualIdentity?.trim() ?? "",
      sexual_preference: sexualPreference?.trim() ?? "",
      racial_preference: racialPreference?.trim() ?? "",
      meeting_interest: meetingInterest?.trim() ?? "",
      bio: about?.trim() || null,
    };

    if (birthday) {
      const date = new Date(birthday);
      if (Number.isNaN(date.getTime())) {
        const error = new Error("Invalid birthday");
        error.statusCode = 400;
        throw error;
      }
      profileData.birthday = date;
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: profileData,
    });

    if (username) {
      await prisma.user.update({
        where: { id: existingProfile.user_id },
        data: { username: username.trim() },
      });
    }

    // Update hobbies (ProfileHobby)
    await prisma.profileHobby.deleteMany({ where: { profile_id: profileId } });
    if (Array.isArray(interests) && interests.length > 0) {
      await createProfileHobbies(profileId, interests);
    }

    // Update profile images
    await prisma.profileImage.deleteMany({ where: { profile_id: profileId } });
    if (Array.isArray(images) && images.length > 0) {
      const imageItems = images
        .filter((url) => typeof url === "string" && url)
        .map((url, index) => ({ image_url: url, order: index }));
      if (imageItems.length > 0) {
        await createProfileImages(profileId, imageItems);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
