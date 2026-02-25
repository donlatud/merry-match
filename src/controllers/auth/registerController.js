import { parseRegisterForm } from "@/lib/parseFormData";
import { register as registerService } from "@/services/auth/registerService";

/**
 * POST /api/auth/register
 * Content-Type: multipart/form-data
 * Fields: payload (JSON string { step1, step2 }), photos (ไฟล์รูป สูงสุด 5)
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export async function register(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let payloadStr;
  let fileItems;
  try {
    const parsed = await parseRegisterForm(req);
    payloadStr = parsed.payloadStr;
    fileItems = parsed.files;
  } catch (parseErr) {
    const message =
      parseErr?.message === "MISSING_PAYLOAD"
        ? "Missing payload field"
        : "Invalid form or file too large";
    return res.status(400).json({ error: message });
  }

  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return res.status(400).json({ error: "Invalid payload JSON" });
  }

  try {
    const { userId } = await registerService({ ...payload, files: fileItems });
    return res.status(201).json({ success: true, userId });
  } catch (error) {
    console.error("[register]", error?.message ?? error, error?.stack);
    const isEmailUniqueViolation =
      error?.code === "P2002" && error?.meta?.target?.includes?.("email");
    const statusCode =
      error.statusCode ?? (isEmailUniqueViolation ? 409 : 500);
    const known = {
      EMAIL_ALREADY_REGISTERED: "Email already registered",
      MISSING_FIELDS: "Missing required fields",
      INVALID_DATE: "Invalid date",
    };
    const message =
      known[error.message] ??
      (isEmailUniqueViolation ? "Email already registered" : null) ??
      (process.env.NODE_ENV === "development" ? error?.message : "Registration failed");
    return res.status(statusCode).json({ error: message });
  }
}
