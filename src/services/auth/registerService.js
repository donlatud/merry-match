import { supabaseServer } from "@/lib/supabaseServer";
import { createUser } from "@/repositories/userRepository";
import { createProfile } from "@/repositories/profileRepository";
import { createProfileHobbies } from "@/repositories/profileHobbyRepository";
import { createProfileImages } from "@/repositories/profileImageRepository";
import { uploadProfileImage, getExtFromMimetype } from "@/lib/storageHelpers";

const MAX_PHOTOS = 5;

/**
 * @param {{
 *   step1: { name: string; date: string | Date; location: string; city: string; username: string; email: string; password: string };
 *   step2: { sexualIdentity: string; sexualPreference: string; racialPreference: string; meetingInterest: string; hobbies: string[] };
 *   files?: { buffer: Buffer; mimetype: string }[];
 * }} payload - ข้อมูลจากฟอร์ม register (client ส่ง step1, step2 ใน field "payload"; ไฟล์รูปใน "photos" ผ่าน Formidable)
 * @returns {Promise<{ userId: string }>}
 */
export async function register(payload) {
  const { step1, step2, files: fileItems = [] } = payload;
  if (!step1?.email || !step1?.password || !step1?.username) {
    throw new Error("MISSING_FIELDS");
  }

  const { data: authData, error: signUpError } = await supabaseServer.auth.signUp({
    email: step1.email.trim(),
    password: step1.password,
    options: {
      data: {
        username: step1.username.trim(),
        full_name: step1.name?.trim(),
      },
    },
  });

  if (signUpError) {
    if (signUpError.message?.includes("already registered") || signUpError.code === "user_already_exists") {
      const err = new Error("EMAIL_ALREADY_REGISTERED");
      err.statusCode = 409;
      throw err;
    }
    const err = new Error(signUpError.message || "SIGNUP_FAILED");
    err.statusCode = 400;
    throw err;
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error("SIGNUP_FAILED");
  }

  await createUser({
    id: userId,
    email: step1.email.trim(),
    username: step1.username.trim(),
  });

  const birthday = step1.date instanceof Date ? step1.date : new Date(step1.date);
  if (Number.isNaN(birthday.getTime())) {
    throw new Error("INVALID_DATE");
  }

  const profile = await createProfile({
    user_id: userId,
    full_name: step1.name?.trim() ?? "",
    birthday,
    location: step1.location?.trim() ?? "",
    city: step1.city?.trim() ?? "",
    gender: step2?.sexualIdentity?.trim() ?? "",
    sexual_preference: step2?.sexualPreference?.trim() ?? "",
    racial_preference: step2?.racialPreference?.trim() ?? "",
    meeting_interest: step2?.meetingInterest?.trim() ?? "",
    bio: null,
  });

  const hobbiesList = Array.isArray(step2?.hobbies) ? step2.hobbies : [];
  if (hobbiesList.length > 0) {
    await createProfileHobbies(profile.id, hobbiesList);
  }

  const photosToUpload = fileItems.slice(0, MAX_PHOTOS).filter((f) => f?.buffer);
  const imageUrlsWithOrder = [];

  for (let i = 0; i < photosToUpload.length; i++) {
    const file = photosToUpload[i];
    const contentType = file.mimetype || "image/jpeg";
    const ext = getExtFromMimetype(file.mimetype);
    const path = `${userId}/${profile.id}/${i}.${ext}`;
    const publicUrl = await uploadProfileImage(
      supabaseServer,
      path,
      file.buffer,
      contentType
    );
    imageUrlsWithOrder.push({ image_url: publicUrl, order: i });
  }

  if (imageUrlsWithOrder.length > 0) {
    await createProfileImages(profile.id, imageUrlsWithOrder);
  }

  return { userId };
}
