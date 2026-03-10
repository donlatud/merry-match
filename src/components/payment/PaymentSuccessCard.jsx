"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PACKAGE_ICON_VARIANTS } from "@/constants/packageIcons";

/**
 * การ์ดแสดงรายละเอียดแพ็กเกจหลังชำระสำเร็จ (gradient, ข้อความสีขาว)
 * ใช้ในหน้า Payment Success ตามดีไซน์ Figma
 *
 * @param {{
 *   packageName: string;
 *   amount: string;
 *   currency?: string;
 *   startDate: string;  // ISO date
 *   nextBillingDate: string;  // ISO date
 *   features?: string[];
 *   iconVariant?: "basic" | "platinum" | "premium";
 *   className?: string;
 * }} props
 */
export function PaymentSuccessCard({
  packageName,
  amount,
  currency = "THB",
  startDate,
  nextBillingDate,
  features = [
    "'Merry' more than a daily limited",
    "Up to 50 Merry per day",
  ],
  iconVariant = "basic",
  className,
}) {
  const start = startDate ? format(new Date(startDate), "dd/MM/yyyy") : "—";
  const next = nextBillingDate
    ? format(new Date(nextBillingDate), "dd/MM/yyyy")
    : "—";
  const icon = PACKAGE_ICON_VARIANTS[iconVariant] ?? PACKAGE_ICON_VARIANTS.basic;

  return (
    <div
      className={cn(
        "bg-utility-linear text-white border border-gray-400 rounded-[24px] p-4 w-full h-[382px] flex flex-col gap-4 lg:h-[454px] lg:min-w-[357px] lg:gap-6 lg:p-10",
        className
      )}
      aria-label="Membership details"
    >
      {/* กล่อง 1: icon */}
      <div>
        <div className="rounded-[16px] bg-gray-100 w-[60px] h-[60px] flex items-center justify-center">
          <img
            src={icon.src}
            alt={icon.alt}
            className="h-9 w-9"
          />
        </div>
      </div>

      {/* กล่อง 2: package name + amount */}
      <div className="flex flex-col gap-2">
        <div className="text-headline3">{packageName}</div>
        <div className="text-body1 flex items-center gap-1.5 text-purple-100">
          {currency} {amount}
          <span className="text-body2!"> /Month</span>
        </div>
      </div>

      {/* กล่อง 3: feature details */}
      <div className="flex flex-col gap-4 border-b border-gray-300 pb-9">
        {features.map((text) => (
          <div key={text} className="flex items-center gap-3">
            <img
              src="/merry_icon/icon-correct-purple.svg"
              alt=""
              aria-hidden
              className="h-4 w-4"
            />
            <span className="text-body2 text-purple-100">{text}</span>
          </div>
        ))}
      </div>

      {/* กล่อง 4: Start Membership / Next billing */}
      <div>
        {/* start membership */}
        <div className="flex justify-between items-center text-body2 py-1 text-purple-200">
          <span>Start Membership</span>
          <span>{start}</span>
        </div>
        {/* next billing */}
        <div className="flex justify-between items-center text-body2 py-1 text-purple-200">
          <span>Next billing</span>
          <span>{next}</span>
        </div>
      </div>
    </div>
  );
}
