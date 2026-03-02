// lib/auth.ts
import { supabase } from "@/providers/supabase.provider";

export async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}