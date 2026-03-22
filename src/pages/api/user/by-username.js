// pages/api/user/by-username.js

import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const { u } = req.query;

  const user = await prisma.user.findUnique({
    where: { username: u },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ email: user.email });
}