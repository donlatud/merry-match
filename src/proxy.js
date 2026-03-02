import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // const { data: profile, error } = await supabase
  //   .from("users")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();
    
  // if (error || profile?.role !== "ADMIN") {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};