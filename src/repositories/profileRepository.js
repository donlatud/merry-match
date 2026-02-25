import { prisma } from "@/lib/prisma";

/**
 * @param {{
 *   user_id: string;
 *   full_name: string;
 *   birthday: Date;
 *   location: string;
 *   city: string;
 *   gender: string;
 *   sexual_preference: string;
 *   racial_preference: string;
 *   meeting_interest: string;
 *   bio?: string | null;
 * }} data
 * @returns {Promise<import('@prisma/client').Profile>}
 */
export async function createProfile(data) {
  return prisma.profile.create({
    data: {
      user_id: data.user_id,
      full_name: data.full_name,
      birthday: data.birthday,
      location: data.location,
      city: data.city,
      gender: data.gender,
      sexual_preference: data.sexual_preference,
      racial_preference: data.racial_preference,
      meeting_interest: data.meeting_interest,
      bio: data.bio ?? null,
    },
  });
}
