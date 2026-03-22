import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";

export default function WhyMerryMatchSection() {
  return (
    <section
      id="why-merry-match"
      className="lg:h-[533px] mx-auto flex items-center justify-around bg-utility-bg relative overflow-hidden"
    >
      <div className="h-200 lg:w-[1120px] mx-auto flex flex-col lg:flex-row items-center justify-around lg:justify-between bg-utility-bg lg:gap-[25px]">
        <div className="w-[343px] lg:w-[549px] text-left flex flex-col items-start gap-10">
          <h2 className="text-headline2 text-purple-300">Why Merry Match?</h2>
          <div className="flex flex-col items-start gap-6">
            <p className="text-body1 text-utility-white">
              Merry Match is a new generation of online dating website for
              everyone.
            </p>
            <p className="text-body2 text-utility-white">
              Whether you&apos;re committed to dating, meeting new people,
              expanding your social network, meeting locals while traveling, or
              even just making a small chat with strangers.{" "}
            </p>
            <p className="text-body2 text-utility-white">
              This site allows you to make your own dating profile, discover new
              people, save favorite profiles, and let them know that you&apos;re
              interested
            </p>
          </div>
        </div>
        {/* overlapping cards — layout เดิม, lg ขยายสัดส่วน 1.59x */}
        <div className="relative mx-auto h-[218.62px] w-[343px] lg:h-[347.6px] lg:w-[545.37px]">
          {/* Fast */}
          <div className="absolute left-[58.57px] top-[2px] z-30 flex items-start justify-start h-[62.48px] w-[149.03px] overflow-hidden rounded-[18.34px] px-3 py-[13px] bg-purple-600 text-utility-white lg:left-[93.12px] lg:top-[3.18px] lg:h-[99.34px] lg:w-[236.96px] lg:rounded-[29.16px] lg:px-4 lg:py-5 shadow-button">
            <PaperAirplaneIcon className="absolute right-[5px] -top-[10px] size-[70.5px] shrink-0 text-purple-400 opacity-50 rotate-135 lg:right-[7.95px] lg:-top-[15.9px] lg:size-[112.1px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/merry_icon/icon-send-2.svg"
              alt="send icon"
              className="size-3 shrink-0 m-1 lg:size-[18px] lg:m-2"
            />
            <span className="text-[13.76px] font-bold pl-[2px] lg:text-[21.9px]">
              Fast
            </span>
          </div>

          {/* Secure */}
          <div className="absolute left-[14.5px] top-[56.65px] z-10 flex items-center justify-end h-[68.47px] w-[250.03px] overflow-hidden rounded-[18.34px] bg-purple-300 px-6 py-4 text-purple-600 lg:left-[23.06px] lg:top-[90.07px] lg:h-[108.87px] lg:w-[397.55px] lg:rounded-[29.16px] lg:px-8 lg:py-6 shadow-button">
            <ShieldCheckIcon className="absolute left-[15.08px] top-[12.5px] size-[70.5px] shrink-0 text-purple-200 opacity-70 lg:left-[23.98px] lg:top-[19.88px] lg:size-[112.1px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/merry_icon/icon-shield-done.svg"
              alt="shield icon"
              className="size-3 shrink-0 m-1 lg:size-5"
            />
            <span className="text-[13.76px] font-bold lg:text-[21.9px] lg:pl-1">
              Secure
            </span>
          </div>

          {/* Easy */}
          <div className="absolute left-[121.62px] top-[111.77px] z-30 flex items-end justify-start h-[91.71px] w-[206.35px] overflow-hidden rounded-[18.34px] bg-purple-200 p-4 text-red-500 lg:left-[193.38px] lg:top-[177.71px] lg:h-[145.82px] lg:w-[328.1px] lg:rounded-[29.16px] lg:p-6 shadow-button">
            <StarIcon className="absolute left-[119px] -bottom-[10.34px] size-[99.74px] shrink-0 text-purple-300 opacity-50 -rotate-39 lg:left-[189.21px] lg:-bottom-[16.44px] lg:size-[158.59px]" />
            <StarIconOutline className="size-[14px] shrink-0 m-1 text-red-500 lg:size-6" />
            <span className="text-[13.76px] font-bold pl-1 lg:text-[21.9px] lg:pl-2">
              Easy
            </span>
          </div>

          {/* Man avatar */}
          <div className="absolute left-[245.68px] top-[30.27px] h-[37.8px] w-[37.8px] overflow-hidden rounded-[572.62px] lg:left-[390.63px] lg:top-[48.13px] lg:h-[60.1px] lg:w-[60.1px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/why-merry-man-laughing.png"
              alt="man laughing"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Woman avatar */}
          <div className="absolute left-[40.23px] bottom-0 h-[60.19px] w-[60.19px] overflow-hidden rounded-[572.62px] lg:left-[63.97px] lg:h-[95.7px] lg:w-[95.7px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/why-merry-woman-laughing-using-laptop.png"
              alt="woman laughing using laptop"
              className="h-full w-full scale-[1.7] object-cover origin-center translate-x-[14%] translate-y-[20%]"
            />
          </div>

          {/* Decorative dots */}
          <div
            className="absolute left-[303.47px] top-[16.33px] size-[5.16px] rounded-full bg-beige-800 lg:left-[482.52px] lg:top-[25.96px] lg:size-[8.2px]"
            aria-hidden
          />
          <div
            className="absolute left-[19.59px] top-[190.83px] size-1 rounded-full bg-purple-400 lg:left-[31.15px] lg:top-[303.42px] lg:size-[6.39px]"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
