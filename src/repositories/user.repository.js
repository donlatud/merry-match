import { prisma } from "@/lib/prisma";

export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      username: true,
    },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });
};