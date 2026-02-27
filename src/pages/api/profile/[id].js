import { errorMiddleware } from "@/middlewares/error.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import { validateProfileId } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { getProfileByIdController } from "@/controllers/profile.controller";

export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    validateProfileId(req);

    await asyncHandler(getProfileByIdController)(req, res);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
