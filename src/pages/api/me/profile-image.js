import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    await authMiddleware(req, res);

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: {
        images: {
          select: { image_url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    return res.status(200).json({
      profile_image_url: profile?.images?.[0]?.image_url ?? null,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
