// src/middlewares/matching/auth.middleware.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const authMiddleware = {
  /**
   * ตรวจสอบ JWT Token และคืนค่า user
   */
  async authenticate(req) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw new Error("Token is required");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    return user;
  },

  /**
   * Method Guard - ตรวจสอบว่าใช้ HTTP Method ที่ถูกต้องหรือไม่
   */
  validateMethod(req, allowedMethods = ["GET"]) {
    if (!allowedMethods.includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed`);
    }
  }
};