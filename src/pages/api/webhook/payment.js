import { allowMethods } from "@/middlewares/method.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { getPaymentGatewayProvider } from "@/providers/paymentGatewayProvider";
import { processPaymentWebhookEvent } from "@/services/package/webhookPaymentService";

export const config = {
  api: { bodyParser: false },
};

/**
 * อ่าน raw body จาก request stream (ใช้เมื่อ bodyParser: false)
 * @param {import("stream").Readable} readable
 * @returns {Promise<Buffer>}
 */
function readRawBody(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

/**
 * POST /api/webhook/payment
 * รับ webhook จาก payment gateway (Omise ฯลฯ) — ต้อง verify signature ตาม document ของ gateway
 *
 * - Omise: ส่ง raw body + headers omise-signature, omise-signature-timestamp
 * - Provider.handleWebhook จะ verify signature แล้วคืน WebhookEvent; ถ้า verify ไม่ผ่าน throw 401
 *
 * Response 200: { received: true, eventId?, type? }
 * Response 4xx/5xx: error message
 */
export default async function handler(req, res) {
  try {
    allowMethods(["POST"])(req, res);

    const rawBody = await readRawBody(req);
    const headers = req.headers || {};
    const signature =
      typeof headers["omise-signature"] === "string"
        ? headers["omise-signature"]
        : Array.isArray(headers["omise-signature"])
          ? headers["omise-signature"][0]
          : undefined;

    const provider = getPaymentGatewayProvider();
    if (typeof provider.handleWebhook !== "function") {
      const err = new Error("WEBHOOK_NOT_SUPPORTED_FOR_CURRENT_GATEWAY");
      err.statusCode = 501;
      throw err;
    }

    const event = await provider.handleWebhook(rawBody, signature, headers);

    const result = await processPaymentWebhookEvent(event);
    if (result?.error) {
      console.warn("[webhook/payment] processPaymentWebhookEvent:", result.error, result);
    }

    return res.status(200).json({
      received: true,
      eventId: event?.id,
      type: event?.type,
      processed: result?.processed ?? false,
      subscriptionId: result?.subscriptionId,
      transactionStatus: result?.transactionStatus,
    });
  } catch (err) {
    return errorMiddleware(err, req, res);
  }
}
