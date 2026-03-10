
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { items } = req.body;

  try {
    await prisma.$transaction(
      items.map((item, index) =>
        prisma.package.update({
          where: { id: item.id },
          data: { sort_order: index },
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
}