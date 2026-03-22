import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, price, limit_matching, icon_url, details } = req.body;

    const createdPackage = await prisma.package.create({
      data: {
        name,
        price,
        limit_matching,
        icon_url,
        details: {
          create: details.map((item, index) => ({
            value: item.value,
            position: index,
          })),
        },
      },
      include: {
        details: true,
      },
    });

    res.status(201).json(createdPackage);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}