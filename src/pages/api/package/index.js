import { getActivePackages } from "@/services/package/packageService";
import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

export default async function handler(req, res) {
  try {
    allowMethods(["GET"])(req, res);
    const packages = await getActivePackages();
    return res.status(200).json(packages);
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}