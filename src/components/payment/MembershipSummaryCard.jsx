import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * สรุปแพ็กเกจ Merry Membership สำหรับหน้า Payment (payment1)
 *
 * @param {{
 *   packageName: string;
 *   mode?: "purchase" | "change-plan";
 *   currentPackageName?: string;
 *   priceLabel?: string;
 *   features?: string[];
 *   className?: string;
 * }} props
 */
export function MembershipSummaryCard({
  packageName,
  mode = "purchase",
  currentPackageName,
  priceLabel = "THB 149.00",
  features = [],
  className,
}) {
  return (
    <div className="border-b border-gray-400 bg-gray-100 pt-8 px-6 flex flex-col gap-4 pb-4 lg:rounded-[24px] lg:border lg:border-gray-400">
      {/* header */}
      <div className="flex items-center gap-3">
        <img
          src="/merry_icon/icon-merry-package.svg"
          alt=""
          aria-hidden
          className="h-6 w-6 shrink-0"
        />
        <div className="text-body1 text-gray-700">
          Merry Membership
        </div>
      </div>
      {/* content */}
      <div>
        {/* package */}
        <div className="flex flex-col">
          {/* package name */}
          <div className="flex justify-between items-center py-2">
            <span className="text-body2 text-gray-700">Package</span>
            {mode === "change-plan" && currentPackageName ? (
              <span className="text-body1 text-gray-900">
                {currentPackageName} <span aria-hidden>→</span> {packageName}
              </span>
            ) : (
              <span className="text-body1 text-gray-900">{packageName}</span>
            )}
          </div>
          {/* features */}
          <div className="flex flex-col gap-2 bg-white py-2.5 px-2">
            {features.map((text) => (
              <div
                key={text}
                className="flex pl-2 gap-2"
              >
                <img
                  src="/merry_icon/icon-correct-purple.svg"
                  alt=""
                  aria-hidden
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="text-body2 text-gray-800">{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* price */}
        <div className="flex justify-between items-center py-6">
          <span className="text-body2 font-normal text-gray-700">Price (Monthly)</span>
          <span className="text-body1 text-gray-900">{priceLabel}</span>
        </div>
      </div>
    </div>
  );
}
