import formidable from "formidable";
import { readFile, unlink } from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

/**
 * Parse multipart/form-data with Formidable for register API.
 * Expects fields: payload (JSON string), photos (files, max 5).
 * @param {import('next').NextApiRequest} req
 * @returns {Promise<{ payloadStr: string; files: { buffer: Buffer; mimetype: string }[] }>}
 */
export function parseRegisterForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        let payloadStr = fields?.payload;
        if (payloadStr == null) {
          return reject(new Error("MISSING_PAYLOAD"));
        }
        if (Array.isArray(payloadStr)) payloadStr = payloadStr[0];
        if (typeof payloadStr !== "string") payloadStr = String(payloadStr);

        const photoFiles = files?.photos ?? [];
        const list = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
        const fileItems = [];

        for (const file of list) {
          const filepath = file?.filepath ?? file?.path;
          if (!filepath) continue;
          try {
            const buffer = await readFile(filepath);
            fileItems.push({
              buffer,
              mimetype: file.mimetype || "image/jpeg",
            });
          } finally {
            try {
              await unlink(filepath);
            } catch {
              // ignore cleanup errors
            }
          }
        }

        resolve({ payloadStr, files: fileItems });
      } catch (e) {
        reject(e);
      }
    });
  });
}
