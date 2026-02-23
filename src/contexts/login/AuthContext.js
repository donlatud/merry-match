import axios from "axios";
import { fi, tr } from "date-fns/locale";
import { useState,createContext } from "react";
import { useRouter } from "next/router";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const login = async (data) => {
    setLoading(true);
    // call API
    try{
        const response = await axios.post("/api/auth/login", data)
        console.log(response.data.user)
        setUser(response.data.user)
        const token = response.data.access_token;
        localStorage.setItem("token", token);
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