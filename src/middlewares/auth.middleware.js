import { supabaseServer } from "@/lib/supabaseServer";

export const authMiddleware = async (req, res) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : authorization?.startsWith("bearer ")
      ? authorization.slice("bearer ".length)
      : "";

  if (!token) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const { data, error: supabaseError } = await supabaseServer.auth.getUser(token);

  if (supabaseError) {
    const error = new Error("Invalid token");
    error.statusCode = 401;
    throw error;
  }

  req.user = data.user;
};