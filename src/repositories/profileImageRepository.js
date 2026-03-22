import { prisma } from "@/lib/prisma";

/**
 * @param {string} profileId
 * @param {{ image_url: string; order: number }[]} items
 * @returns {Promise<import('@prisma/client').ProfileImage[]>}
 */
export async function createProfileImages(profileId, items) {
  const created = [];
  for (const item of items) {
    const row = await prisma.profileImage.create({
      data: {
        profile_id: profileId,
        image_url: item.image_url,
        order: item.order,
      },
    });
    created.push(row);
  }
  return created;
}
