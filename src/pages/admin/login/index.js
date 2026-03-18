import { useState } from "react";
import Image from "next/image";
import InputBar from "@/components/commons/input/InputBar";
import PasswordInput from "@/components/commons/input/PasswordInput";
import { useAuth } from "@/hooks/login/useAuth";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { merryToast } from '@/components/commons/toast/MerryToast'
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

function LoginPage(){
    const {login} = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(false);


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!identifier || !password) {
    const msg = "Username/email and password are required";
    setError(msg);
    merryToast.error("Missing information!", msg, <ExclamationCircleIcon className="size-10! text-red-400" />);
    return;
  }

  try {
    setLoading(true);
    const data = { identifier, password };
    const success = await login(data);
    if (!success) {
      setLoading(false);
      const msg = "Invalid email/username or password";
      setError(msg);
      merryToast.error("Login failed!", msg, <ExclamationCircleIcon className="size-10! text-red-400" />);
      return;
    }

    merryToast.success(
      "Success!",
      "Login successful",
      <CheckCircleIcon className="size-10! text-green-500" />,
    );
    setTimeout(() => {
      router.push("/admin");
    }, 1500); // หน่วง 1.5 วินาที
  } catch (error) {
    setLoading(false);
    const msg = error.message || "Something went wrong";
    setError(msg);
    merryToast.error("Error", msg, <ExclamationCircleIcon className="size-10! text-red-400" />);
  }
};
    return(
      <>
        <NavBar />
        <div className="min-h-90vh flex items-center lg:h-screen pb-20">
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
            <span className="text-beige-700 text-body4 ">LOGIN</span>
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
          className="max-h-12"
        />
        </div>

        {/* Password */}
        <div>
        <label className="block text-sm mb-1">Password</label>
        <div className="relative mb-4">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="max-h-12"
          />
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
          className="w-full bg-red-500 text-white rounded-full py-3 mb-4 cursor-pointer"
          disabled={loading}
          >
          Log in
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