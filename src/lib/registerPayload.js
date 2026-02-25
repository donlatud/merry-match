/**
 * เตรียม payload และรายการไฟล์รูปจากฟอร์ม register (step1, step2, step3)
 * ใช้ส่งไป POST /api/auth/register แบบ multipart/form-data
 *
 * @param {{
 *   name?: string;
 *   date?: Date | string;
 *   location?: string;
 *   city?: string;
 *   username?: string;
 *   email?: string;
 *   password?: string;
 * }} step1Form
 * @param {{
 *   sexualIdentity?: string;
 *   sexualPreference?: string;
 *   racialPreference?: string;
 *   meetingInterest?: string;
 *   hobbies?: string[];
 * }} step2Form
 * @param {{ photos?: (File | null)[] }} step3Form
 * @returns {{
 *   payloadForApi: { step1: Record<string, unknown>; step2: Record<string, unknown> };
 *   photoFiles: File[];
 * }}
 */
export function buildRegisterPayload(step1Form, step2Form, step3Form) {
  const dateValue = step1Form?.date;
  const dateStr =
    dateValue instanceof Date
      ? dateValue.toISOString()
      : dateValue != null && dateValue !== ""
        ? String(dateValue)
        : "";

  const step1 = {
    name: step1Form?.name?.trim() ?? "",
    date: dateStr,
    location: step1Form?.location?.trim() ?? "",
    city: step1Form?.city?.trim() ?? "",
    username: step1Form?.username?.trim() ?? "",
    email: step1Form?.email?.trim() ?? "",
    password: step1Form?.password ?? "",
  };

  const step2 = {
    sexualIdentity: step2Form?.sexualIdentity?.trim() ?? "",
    sexualPreference: step2Form?.sexualPreference?.trim() ?? "",
    racialPreference: step2Form?.racialPreference?.trim() ?? "",
    meetingInterest: step2Form?.meetingInterest?.trim() ?? "",
    hobbies: Array.isArray(step2Form?.hobbies) ? step2Form.hobbies : [],
  };

  const photos = step3Form?.photos ?? [];
  const photoFiles = photos.filter((p) => p != null && p instanceof File);

  return {
    payloadForApi: { step1, step2 },
    photoFiles,
  };
}
