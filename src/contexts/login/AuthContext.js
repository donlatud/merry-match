import { supabase } from "@/providers/supabase.provider";
import { fi, tr } from "date-fns/locale";
import { useState, createContext, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // เริ่มต้นเป็น true เพื่อตรวจสอบ token
  const router = useRouter();

  // ตรวจสอบ token เมื่อ app เริ่มต้น
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      }

      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ identifier, password }) => {
    setLoading(true);

    try {
      let emailToLogin = identifier;

      // ถ้าไม่ใช่ email → หา email ก่อน
      if (!identifier.includes("@")) {
        const res = await fetch(`/api/user/by-username?u=${identifier}`);
        const result = await res.json();

        if (!res.ok || !result.email) {
          return false;
        }

        emailToLogin = result.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });

      if (error || !data.session) {
        return false;
      }

      // Supabase จะ persist session ให้อัตโนมัติ
      setUser(data.user);

      return true;
    } catch (err) {
      console.log(err)
      console.error("Login error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const isAuthenticated = Boolean(user);
  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
