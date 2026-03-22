import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import Link from "next/link";
import { useAuth } from "@/hooks/login/useAuth";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section
      id="hero"
      className="h-[1035px] lg:h-[758px] mx-auto flex items-center justify-center bg-utility-bg relative overflow-hidden"
    >
      {/* ========== MOBILE: Top-left image ========== */}
      <div className="absolute top-0 left-0 z-0 h-[305px] w-[174.46px] lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- use img for exact design dimensions */}
        <img
          src="/images/hero-woman-laughing.png"
          alt="woman laughing"
          className="absolute -left-[10px] -top-[96px] h-[305px] w-[174.46px] object-cover object-[17.08px_left] rounded-[609.39px] opacity-100"
        />
      </div>
      {/* MOBILE: Speech bubble Hi! Nice to meet you */}
      <div
        className="absolute z-1 top-0 left-0 flex items-center justify-center overflow-hidden h-[25.01px] w-[90.28px] rounded-t-[14.64px] rounded-br-[14.64px] bg-red-700 px-2 py-1 text-[7.32px] font-semibold leading-tight text-utility-white translate-x-[110%] translate-y-[600%] lg:hidden"
        aria-hidden
      >
        Hi! Nice to meet you
      </div>

      {/* ========== MOBILE: Bottom-right image ========== */}
      <div className="absolute bottom-0 right-0 z-0 w-[215.5px] h-[376.75px] lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- use img for exact design dimensions */}
        <img
          src="/images/hero-woman-laughing-using-laptop.png"
          alt="woman laughing using laptop"
          className="absolute right-0 bottom-0 w-[215.5px] h-[376.75px] object-cover object-[32.4px_left] rounded-[752.75px] opacity-100 translate-x-[16%] translate-y-[1%]"
        />
      </div>
      {/* MOBILE: Speech bubble Nice to meet you too! */}
      <div
        className="absolute z-1 bottom-0 right-0 flex items-center justify-center overflow-hidden h-[30.89px] w-[115.29px] rounded-t-[18.08px] rounded-bl-[18.08px] bg-red-700 px-2 py-1 text-[9.04px] font-semibold leading-tight text-utility-white -translate-x-[85%] -translate-y-[920%] lg:hidden"
        aria-hidden
      >
        Nice to meet you too!
      </div>

      {/* DESKTOP: wrapper max-w-7xl*/}
      <div className="absolute inset-0 left-1/2 w-full max-w-[1120px] -translate-x-1/2 hidden lg:block">
        {/* Left image (woman with laptop)*/}
        <div className="absolute left-0 bottom-0 z-0 w-[286px] h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-woman-laughing-using-laptop.png"
            alt="woman laughing using laptop"
            className="absolute left-12 bottom-0 w-[286px] h-[500px] object-cover object-[43px_left] rounded-[999px]"
          />
        </div>
        <div
          className="absolute left-0 bottom-[380px] z-10 flex h-[41px] w-[153px] items-center justify-center overflow-hidden rounded-t-[24px] rounded-bl-[24px] bg-red-700 pl-2 text-tagline font-semibold leading-tight text-utility-white"
          aria-hidden
        >
          Nice to meet you too!
        </div>
        <span
          className="absolute z-10 left-[10px] bottom-[398px] text-tagline text-purple-100 -rotate-38"
          aria-hidden
        >
          ♥
        </span>

        {/* Right image (woman laughing)*/}
        <div className="absolute right-0 top-0 z-0 w-[286px] h-[305px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-woman-laughing.png"
            alt="woman laughing"
            className="absolute right-[45px] -top-[144px] w-[286px] h-[500px] object-cover object-[28px_left] rounded-[999px]"
          />
        </div>
        <div
          className="absolute right-0 top-[250px] z-10 flex h-[41px] w-[148px] items-center justify-center overflow-hidden rounded-t-[24px] rounded-br-[24px] bg-red-700 text-tagline font-semibold leading-tight text-utility-white"
          aria-hidden
        >
          Hi! Nice to meet you
        </div>
        <span
          className="absolute right-[400px] top-[98px] text-[28px] text-purple-700"
          aria-hidden
        >
          ♥
        </span>
        <div
          className="absolute right-[45px] top-[553px] size-2 rounded-full bg-beige-700"
          aria-hidden
        />

        {/* Main content — centered */}
        <div className="absolute left-[50%] top-[45%] z-10 w-[358px] -translate-x-1/2 -translate-y-1/2 text-center text-utility-white flex flex-col items-center justify-center gap-18">
          <div className="flex flex-col items-center justify-center gap-6">
            <h1 className="text-headline1">Make the first ‘Merry’</h1>
            <p className="text-body1">
              If you feel lonely, let’s start meeting new people in your area!
              <br />
              Don’t forget to get Merry with us
            </p>
          </div>
          <PrimaryButton
            className="w-auto min-w-0 text-body2! font-bold cursor-pointer active:duration-0 active:[animation-duration:0ms]"
            asChild
          >
            <Link href={isAuthenticated ? "/matchingpage" : "/login"}>
              Start Matching!
            </Link>
          </PrimaryButton>
        </div>
      </div>

      {/* Decorative — desktop only, เต็ม viewport */}
      <div
        className="absolute left-[118px] top-[72px] hidden size-[7px] rounded-full bg-red-300 lg:block"
        aria-hidden
      />
      <div
        className="absolute right-[100px] top-[452px] hidden size-15 rounded-full bg-red-800 lg:block"
        aria-hidden
      />
      <div
        className="absolute -left-[9px] top-[108px] hidden size-[67px] rounded-full bg-purple-800 lg:block"
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/merry_icon/icon-grinning-face-with-smiling-eyes.svg"
        alt="grinning face with smiling eyes 😄"
        className="absolute z-10 right-[142px] top-[481px] size-[28px] hidden lg:block"
      />

      {/* Main content — mobile only (horizontally centered) */}
      <div className="absolute z-10 top-[245px] left-1/2 w-[343px] -translate-x-1/2 text-center text-utility-white flex flex-col items-center justify-center gap-18 lg:hidden">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-headline1">Make the first ‘Merry’</h1>
          <p className="text-body1">
            If you feel lonely, let’s start meeting new people in your area!
            <br />
            Don’t forget to get Merry with us
          </p>
        </div>
        <PrimaryButton
          className="w-auto min-w-0 text-body2! font-bold cursor-pointer"
          asChild
        >
          <Link href={isAuthenticated ? "/matchingpage" : "/login"}>
            Start Matching!
          </Link>
        </PrimaryButton>
      </div>
    </section>
  );
}
