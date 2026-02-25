import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useAuth } from "@/hooks/login/useAuth";

export default function CtaSection() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section
      id="cta"
      className="h-[564px] py-0 bg-utility-bg lg:h-auto lg:pt-20 lg:pb-30"
    >
      <div className="w-full h-full mx-auto max-w-[1120px]">
        <div
          className="relative overflow-hidden rounded-none text-center text-utility-white h-full lg:h-[396px] lg:rounded-[32px] flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(106.64% 594.8% at 3.13% 0%, #820025 35.64%, #A95BCD 100%)",
          }}
        >
          {/* Decorative hearts */}
          <HeartIcon className="absolute z-0 -left-[30.44px] top-[34.07px] size-[180px] text-red-300 opacity-30 -rotate-15" />
          <HeartIcon className="absolute z-0 right-[45px] lg:right-[64px] bottom-[105px] lg:bottom-[137px] size-[30px] text-purple-300 opacity-50 -rotate-10" />
          <HeartIcon className="absolute z-0 -right-[32px] lg:-right-[15px] -bottom-[6px] lg:bottom-[24px] size-[100px] text-purple-300 opacity-50 rotate-15" />

          <h2 className="z-10 text-headline2">
            <span className="lg:hidden">
              Let’s start
              <br />
              finding
              <br />
              and matching
              <br />
              someone new
            </span>
            <span className="hidden lg:block">
              Let’s start finding <br />
              and matching someone new
            </span>
          </h2>

          <div className="mt-7 lg:mt-12">
            <SecondaryButton 
            className="w-auto min-w-0 text-body2! font-bold cursor-pointer"
            asChild
            >
            <Link href={isAuthenticated ? "/matching-page" : "/login"}>
              Start Matching!
            </Link>
            </SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

