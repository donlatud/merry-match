// providers/supabase.provider.js

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// SSR client — ใช้สำหรับ auth, REST API, fetch ทั่วไป
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Realtime client — ใช้สำหรับ Realtime เท่านั้น
// createBrowserClient จาก @supabase/ssr override realtime.setAuth
// ทำให้ JWT ไม่ถูกส่งไปกับ WebSocket → ได้ Error 401
export const supabaseRealtime = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);