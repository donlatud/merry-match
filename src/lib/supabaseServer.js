/**
 * Supabase client สำหรับฝั่ง server เท่านั้น (API routes, Server Actions).
 * ห้าม import ใน Client Component เพื่อไม่ให้ SERVICE_ROLE_KEY หลุดไปที่ browser
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for server admin)."
  );
}

/**
 * ใช้ SERVICE_ROLE_KEY ถ้ามี (สำหรับ bypass RLS) ไม่เช่นนั้นใช้ ANON_KEY (เพียงพอสำหรับ auth.signUp)
 */
export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
