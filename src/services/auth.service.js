import { supabase } from "@/providers/supabase.provider";
import {
  findUserByUsername,
  findUserByEmail,
} from "@/repositories/user.repository";

export const loginService = async (identifier, password) => {
  if (!identifier || !password) {
    throw new Error("Identifier and password are required");
  }

  let emailToLogin = identifier;

  if (!identifier.includes("@")) {
    const user = await findUserByUsername(identifier);

    if (!user) {
      throw new Error("User not found");
    }

    emailToLogin = user.email;
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    });

  if (error) {
    throw new Error("Invalid credentials");
  }

  const dbUser = await findUserByEmail(emailToLogin);

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: dbUser,
  };
};