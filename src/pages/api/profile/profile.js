import { authMiddleware } from "@/middlewares/auth.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    await authMiddleware(req, res);

    const supabaseUser = req.user;

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
      select: {
        id: true,
        email: true,
        username: true,
        profile: {
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
