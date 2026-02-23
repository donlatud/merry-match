import { loginController } from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { allowMethods } from "@/middlewares/method.middleware";
import  validateLogin  from "@/middlewares/validate.middleware";

export default async function handler(req, res) {
  try {
    allowMethods(["POST"])(req, res);
    validateLogin(req, res);

    await asyncHandler(loginController)(req, res);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}