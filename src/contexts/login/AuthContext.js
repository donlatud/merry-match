import axios from "axios";
import { fi, tr } from "date-fns/locale";
import { useState, createContext, useEffect } from "react";
import { useRouter } from "next/router";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // เริ่มต้นเป็น true เพื่อตรวจสอบ token
  const router = useRouter();

  // ตรวจสอบ token เมื่อ app เริ่มต้น
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // ตรวจสอบ token กับ server (optional)
          // หรือแค่ดึงข้อมูล user จาก token
          const userFromStorage = localStorage.getItem("user");
          if (userFromStorage) {
            setUser(JSON.parse(userFromStorage));
          }
        }
      } catch (error) {
        console.log("Error checking auth status:", error);
        // ถ้า token หมดอายุหรือไม่ valid ให้ลบออก
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  const login = async (data) => {
    setLoading(true);
    // call API
    try{
        const response = await axios.post("/api/auth/login", data)
        console.log(response.data.user)
        setUser(response.data.user)
        const token = response.data.access_token;
        
        // บันทึกทั้ง token และ user ใน localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        return true;
    }
    catch(error){
        console.log(error);
        return false;
    }
    finally{
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // ลบข้อมูล authentication ทั้งหมดจาก localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login")
  };
    const isAuthenticated = Boolean(user);
  return (
    <AuthContext.Provider value={{  
        user,
        role: user?.role || null,
        isAuthenticated,
        loading,
        login,
        logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};