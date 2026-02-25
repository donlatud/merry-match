import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * @param {{ id: string; email: string; username: string }} data - id จาก Supabase Auth
 * @returns {Promise<import('@prisma/client').User>}
 */
export async function createUser(data) {
  return prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      username: data.username,
      role: Role.USER,
    },
  });
}
