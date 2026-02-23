import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // อนุญาตเฉพาะ POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // รับ identifier (email หรือ username) และ password
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Identifier and password are required",
      });
    }

    let emailToLogin = identifier;

    // ถ้า identifier ไม่มี @ → ถือว่าเป็น username
    if (!identifier.includes("@")) {
      // หา email จาก Prisma โดยใช้ username
      const user = await prisma.user.findUnique({
        where: { username: identifier },
      });

      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      emailToLogin = user.email;
    }

    // ใช้ email ไป login กับ Supabase
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });

    if (error) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }

    // ดึง role จาก Prisma (เพราะ Supabase ไม่รู้ role)
    const dbUser = await prisma.user.findUnique({
      where: { email: emailToLogin },
      select: {
        id: true,
        role: true,
        username: true,
      },
    });

    return res.status(200).json({
      message: "Signed in successfully",
      access_token: data.session.access_token,
      user: dbUser,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}