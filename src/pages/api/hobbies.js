import { prisma } from "@/lib/prisma";

/**
 * 🔒 Canonical rule ของระบบ
 * - lowercase
 * - trim
 * - แปลง dash เป็น space
 * - รวม space ซ้ำ
 */
function normalizeTag(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

export default async function handler(req, res) {
  try {
    // ---------------- GET ----------------
    if (req.method === "GET") {
      let { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(200).json([]);
      }

      const normalized = normalizeTag(q);

      if (normalized.length < 1) {
        return res.status(200).json([]);
      }

      const hobbies = await prisma.hobby.findMany({
        where: {
          name: {
            startsWith: normalized,
          },
        },
        orderBy: { name: "asc" },
        take: 10,
      });

      return res.status(200).json(hobbies);
    }

    // ---------------- POST ----------------
    if (req.method === "POST") {
      if (!req.body?.name || typeof req.body.name !== "string") {
        return res.status(400).json({ error: "Invalid name" });
      }

      const normalized = normalizeTag(req.body.name);

      if (normalized.length < 2 || normalized.length > 30) {
        return res.status(400).json({
          error: "Name must be between 2-30 characters",
        });
      }

      const validPattern = /^[a-z0-9\s]+$/;
      if (!validPattern.test(normalized)) {
        return res.status(400).json({
          error: "Only lowercase letters, numbers and spaces allowed",
        });
      }

      // 🔒 ตรวจซ้ำด้วย canonical ก่อน create
      const existing = await prisma.hobby.findFirst({
        where: {
          name: normalized,
        },
      });

      if (existing) {
        return res.status(200).json(existing);
      }

      const hobby = await prisma.hobby.create({
        data: { name: normalized },
      });

      return res.status(200).json(hobby);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}