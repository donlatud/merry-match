import { prisma } from "@/lib/prisma";

const MAX_HOBBIES = 10;

/**
 * หาหรือสร้าง Hobby จากชื่อ แล้วคืน id
 * @param {string} name
 * @returns {Promise<number>}
 */
async function getOrCreateHobbyId(name) {
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  if (typeof prisma.hobby?.upsert !== "function") {
    throw new Error("Prisma client missing Hobby model. Run: npx prisma generate");
  }
  const hobby = await prisma.hobby.upsert({
    where: { name: trimmed },
    create: { name: trimmed },
    update: {},
  });
  return hobby.id;
}

/**
 * สร้างรายการ profile_hobbies จากชื่อ hobby (เชื่อมกับตาราง hobbies)
 * @param {string} profileId
 * @param {string[]} hobbyNames - รายการชื่อ hobby สูงสุด 10 ตัว
 * @returns {Promise<import('@prisma/client').ProfileHobby[]>}
 */
export async function createProfileHobbies(profileId, hobbyNames) {
  if (!profileId || !Array.isArray(hobbyNames) || hobbyNames.length === 0) {
    return [];
  }
  const names = [...new Set(hobbyNames.map((n) => String(n).trim()).filter(Boolean))].slice(
    0,
    MAX_HOBBIES
  );
  if (names.length === 0) return [];

  const hobbyIds = [];
  for (const name of names) {
    const id = await getOrCreateHobbyId(name);
    if (id != null && !hobbyIds.includes(id)) hobbyIds.push(id);
  }
  if (hobbyIds.length === 0) return [];

  const data = hobbyIds.map((hobby_id) => ({
    profile_id: profileId,
    hobby_id,
  }));

  await prisma.profileHobby.createMany({
    data,
    skipDuplicates: true,
  });

  return prisma.profileHobby.findMany({
    where: { profile_id: profileId },
    include: { hobby: true },
    orderBy: { hobby_id: "asc" },
  });
}
