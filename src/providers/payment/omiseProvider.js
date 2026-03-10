import crypto from "crypto";
import Omise from "omise";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`Missing env: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return value;
}

function normalizeCurrency(currency) {
  const value = String(currency || "").trim();
  if (!value) {
    const err = new Error("MISSING_CURRENCY");
    err.statusCode = 400;
    throw err;
  }
  return value.toLowerCase();
}

function parseAmountToMinorUnits(amount, currency) {
  const cur = normalizeCurrency(currency);
  const raw = String(amount ?? "").trim();
  if (!raw) {
    const err = new Error("MISSING_AMOUNT");
    err.statusCode = 400;
    throw err;
  }

  // For THB this is satang (2 decimals). Keep implementation simple for now.
  const match = raw.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    const err = new Error("INVALID_AMOUNT_FORMAT");
    err.statusCode = 400;
    throw err;
  }

  const whole = Number.parseInt(match[1], 10);
  const frac = (match[2] || "").padEnd(2, "0");
  const minor = whole * 100 + Number.parseInt(frac || "0", 10);

  if (!Number.isFinite(minor) || minor <= 0) {
    const err = new Error("INVALID_AMOUNT_VALUE");
    err.statusCode = 400;
    throw err;
  }

  // Omise expects currency like "thb"
  if (!cur) return minor;
  return minor;
}

function createOmiseClient() {
  const secretKey = getRequiredEnv("OMISE_SECRET_KEY");
  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || secretKey;
  const omiseVersion = process.env.OMISE_API_VERSION;

  const omiseFactory = typeof Omise === "function" ? Omise : Omise?.default;
  if (typeof omiseFactory !== "function") {
    const err = new Error("OMISE_SDK_IMPORT_FAILED");
    err.statusCode = 500;
    throw err;
  }

  return omiseFactory({
    secretKey,
    publicKey,
    ...(omiseVersion ? { omiseVersion } : {}),
  });
}

function verifyOmiseWebhookSignature({ rawBodyString, signatureHeader, timestamp }) {
  const secretBase64 = getRequiredEnv("OMISE_WEBHOOK_SECRET");
  const secret = Buffer.from(secretBase64, "base64");

  const signedPayload = `${timestamp}.${rawBodyString}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest();

  const signatures = String(signatureHeader)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sig of signatures) {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      if (sigBuf.length !== expected.length) continue;
      if (crypto.timingSafeEqual(sigBuf, expected)) return true;
    } catch {
      // ignore invalid signature formats
    }
  }

  return false;
}

function extractPromptpayQrImageUrl(obj) {
  const downloadUri = obj?.scannable_code?.image?.download_uri;
  if (typeof downloadUri === "string" && downloadUri.length > 0) return downloadUri;

  const uri = obj?.scannable_code?.image?.uri;
  if (typeof uri === "string" && uri.length > 0) return uri;

  return null;
}

function promisifyOmiseCall(fn) {
  return new Promise((resolve, reject) => {
    fn((err, resp) => {
      if (err) return reject(err);
      return resolve(resp);
    });
  });
}

/**
 * @returns {import("../paymentGatewayProvider").PaymentGatewayProvider}
 */
export function createOmisePaymentGatewayProvider() {
  const client = createOmiseClient();

  return {
    async createCardCharge(params) {
      const currency = normalizeCurrency(params.currency);
      const amount = parseAmountToMinorUnits(params.amount, currency);

      if (!params.cardToken) {
        const err = new Error("MISSING_CARD_TOKEN");
        err.statusCode = 400;
        throw err;
      }

      const charge = await promisifyOmiseCall((cb) =>
        client.charges.create(
          {
            amount,
            currency,
            description: params.description || "MerryMatch package charge",
            card: params.cardToken,
            ...(params.metadata ? { metadata: params.metadata } : {}),
          },
          cb
        )
      );

      const status = charge?.paid
        ? "successful"
        : charge?.status === "pending"
          ? "pending"
          : "failed";

      return {
        id: charge?.id,
        status,
        amount: params.amount,
        currency: params.currency,
        raw: charge,
      };
    },

    async createQrCharge(params) {
      const currency = normalizeCurrency(params.currency);
      const amount = parseAmountToMinorUnits(params.amount, currency);

      const source = await promisifyOmiseCall((cb) =>
        client.sources.create(
          {
            type: "promptpay",
            amount,
            currency,
          },
          cb
        )
      );

      const charge = await promisifyOmiseCall((cb) =>
        client.charges.create(
          {
            amount,
            currency,
            description: params.description || "MerryMatch package charge (PromptPay)",
            source: source.id,
            ...(params.metadata ? { metadata: params.metadata } : {}),
          },
          cb
        )
      );

      const qrImageUrl =
        extractPromptpayQrImageUrl(source) ||
        extractPromptpayQrImageUrl(charge?.source) ||
        extractPromptpayQrImageUrl(charge?.source?.scannable_code);

      if (!qrImageUrl) {
        const err = new Error("OMISE_PROMPTPAY_QR_IMAGE_NOT_FOUND");
        err.statusCode = 500;
        throw err;
      }

      return {
        id: charge?.id || source?.id,
        status: charge?.status || "pending",
        qrImageUrl,
        raw: { source, charge },
      };
    },

    async handleWebhook(rawBody, signature, headers) {
      const rawBodyString =
        typeof rawBody === "string" ? rawBody : Buffer.from(rawBody || "").toString("utf8");

      const signatureHeader =
        signature ||
        (Array.isArray(headers?.["omise-signature"])
          ? headers["omise-signature"][0]
          : headers?.["omise-signature"]);

      const timestamp =
        Array.isArray(headers?.["omise-signature-timestamp"])
          ? headers["omise-signature-timestamp"][0]
          : headers?.["omise-signature-timestamp"];

      if (!signatureHeader || !timestamp) {
        const err = new Error("MISSING_OMISE_SIGNATURE_HEADERS");
        err.statusCode = 401;
        throw err;
      }

      const ok = verifyOmiseWebhookSignature({
        rawBodyString,
        signatureHeader,
        timestamp,
      });

      if (!ok) {
        const err = new Error("INVALID_OMISE_SIGNATURE");
        err.statusCode = 401;
        throw err;
      }

      let parsed;
      try {
        parsed = JSON.parse(rawBodyString || "{}");
      } catch {
        const err = new Error("INVALID_JSON_BODY");
        err.statusCode = 400;
        throw err;
      }

      const eventType = parsed?.key || parsed?.type || "omise.event";
      const charge = parsed?.data || null;

      const data =
        charge && typeof charge === "object"
          ? {
              chargeId: charge.id,
              amount: charge.amount,
              currency: charge.currency ? String(charge.currency).toUpperCase() : undefined,
              status: charge.status,
              paid: charge.paid,
              metadata: charge.metadata,
            }
          : parsed;

      return {
        id: parsed?.id || `omise_event_${Date.now()}`,
        type: eventType,
        data,
        raw: parsed,
      };
    },
  };
}

