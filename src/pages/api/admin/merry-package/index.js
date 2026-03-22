import {prisma} from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const packages = await prisma.package.findMany({
      orderBy: { sort_order: "asc" },
      select: {
        id: true,
        name: true,
        icon_url: true,
        limit_matching: true,
        created_at: true,
        updated_at: true,
      },
    });

    // map ให้ตรงกับ frontend
    const formatted = packages.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon_url,
      merryLimit: p.limit_matching,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("GET merry-package error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}