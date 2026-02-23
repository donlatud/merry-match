import { supabase } from "@/providers/supabase.provider";

export const authMiddleware = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const { data, error: supabaseError } =
    await supabase.auth.getUser(token);

  if (supabaseError) {
    const error = new Error("Invalid token");
    error.statusCode = 401;
    throw error;
  }

  req.user = data.user;
};