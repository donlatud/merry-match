const PROFILE_IMAGES_BUCKET = "merry-match-bucket";

/**
 * หา extension จาก mimetype
 * @param {string} mimetype
 * @returns {string}
 */
export function getExtFromMimetype(mimetype) {
  if (!mimetype) return "jpg";
  if (mimetype.includes("png")) return "png";
  if (mimetype.includes("gif")) return "gif";
  if (mimetype.includes("webp")) return "webp";
  return "jpg";
}

/**
 * อัปโหลดรูปไป Supabase Storage แล้วคืน public URL
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} path - path ใน bucket เช่น "userId/profileId/0.jpg"
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {Promise<string>} public URL
 */
export async function uploadProfileImage(supabase, path, buffer, contentType) {
  const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export { PROFILE_IMAGES_BUCKET };
