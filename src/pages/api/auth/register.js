import { withAsyncHandler } from "@/middlewares/withAsyncHandler";
import { register as registerController } from "@/controllers/auth/registerController";

export const config = {
  api: { bodyParser: false },
};

/**
 * Route: POST /api/auth/register
 * Content-Type: multipart/form-data
 * Fields: payload (JSON string ของ step1, step2), photos (ไฟล์รูป สูงสุด 5)
 */
export default withAsyncHandler(registerController);
