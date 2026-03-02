import { prisma } from "@/lib/prisma";
import { supabase } from "@/providers/supabase.provider";

export default async function handler(req, res) {
  if (req.method === "GET") {
  try {
    // 1️⃣ ดึง token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2️⃣ verify token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log(user)

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 3️⃣ pagination
    const page = parseInt(req.query.page) || 0;
    const take = 20;

const complaints = await prisma.complaint.findMany({
  orderBy: { createdAt: "desc" },
  take,
  skip: page * take,
  include: {
    user: {
      select: {
        id: true,
        username: true,
        email: true,
      },
    },
  },
});

    return res.status(200).json(complaints);
  } catch (err) {
    console.error("GET complaints error:", err);
    return res.status(500).json({ error: "Fetch failed" });
  }
}

  if (req.method === "POST") {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { issue, description } = req.body;

      if (!issue || !description) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const created = await prisma.complaint.create({
        data: {
          userId: user.id,
          issue,
          description,
          status: "new",
        },
      });

      return res.status(201).json(created);
    } catch (error) {
      console.error("REAL ERROR:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).end();
}
