import { useState } from "react";
import Image from "next/image";
import InputBar from "@/components/commons/input/InputBar";
import { useAuth } from "@/hooks/login/useAuth";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { merryToast } from '@/components/commons/toast/MerryToast'
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";

function LoginPage(){
    const {login} = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword,setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!identifier || !password) {
    const msg = "Email/Username and password are required";
    setError(msg);
    merryToast.error("Error", msg, "/merry_icon/icon-add.svg");
    return;
  }

  try {
    const data = { identifier, password };
    const success = await login(data);
    console.log("success:",success)
    if (!success) {
      const msg = "Error with Username/Email or Password";
      setError(msg);
      merryToast.error("Error", msg, "/merry_icon/icon-add.svg");
      return;
    }

    merryToast.success("สำเร็จ!", "ดำเนินการเรียบร้อยแล้ว", "/merry_icon/icon-add.svg");
    setTimeout(() => {
      router.push("/");
    }, 1500); // หน่วง 1.5 วินาที
  } catch (error) {
    const msg = error.message || "Something went wrong";
    setError(msg);
    merryToast.error("Error", msg, "/merry_icon/icon-add.svg");
  }
};
    return(
      <>
        <NavBar />
        <div className="min-h-90vh flex items-center lg:pt-12 pt-12 lg:h-screen">
        <Image src="/images/login/login-vector.svg"
          alt="Login vector"
          width={108}
          height={133}
          className="hidden lg:flex lg:absolute lg:top-60 z-0"/>
        <div className="flex flex-col lg:flex-row py-10 px-4 gap-10 lg:gap-0 lg:justify-between lg:max-w-280 w-full lg:mx-auto lg:items-center z-1">
        <Image src="/images/login/login-hero-image.svg"   
            alt="Login hero"
            width={177}
            height={266}
            className="lg:w-112.5  lg:h-[677px] mx-auto lg:mx-0"
        />
        <div className="lg:mx-0 mx-auto lg:my-auto max-w-108.75">
            <span className="text-beige-700 text-body4 ">Login</span>
            <h2 className="text-headline2 text-purple-500 mb-10">Welcome back to Merry Match</h2>

        <form
        onSubmit={handleSubmit}
        className="bg-(--color-brown-100) gap-10 flex flex-col"
      >
        {/* Email & Username */}
        <div>
        <label className="block text-sm mb-1">Username or Email</label>
        <InputBar
          type="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter Username or Email"
          className=""
        />
        </div>

        {/* Password */}
        <div>
        <label className="block text-sm mb-1">Password</label>
        <div className="relative mb-4">
          <InputBar
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className=""
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        </div>
        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <PrimaryButton
          type="submit"
          className="w-full bg-red-500 text-white rounded-full py-3 mb-4">
          Login
        </PrimaryButton>


        {/* Sign up link */}
        <p className="text-body2 text-black">
          Don’t have any account?{" "}
          <span
            onClick={() =>  router.push("/register")}
            className="text-red-500  cursor-pointer"
          >
            Register
          </span>
        </p>
        </form>
        </div>
        </div>
        </div>
      </>
    )
}

export default LoginPage