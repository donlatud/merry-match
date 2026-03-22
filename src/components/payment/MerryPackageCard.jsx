import { PrimaryButton } from "@/components/commons/button/PrimaryButton";

/**
 * Single Merry Package card
 * ใช้ iconUrl จาก API (เหมือน MembershipContent) แทน PACKAGE_ICON_VARIANTS
 *
 * @param {{
 *   id: number;
 *   name: string;
 *   price: string;
 *   priceLabel?: string;
 *   limitText: string;
 *   features: string[];
 *   iconUrl?: string | null;
 *   onChoosePackage?: (selected: {
 *     id: number;
 *     name: string;
 *     price: string;
 *     limitText: string;
 *     features: string[];
 *     iconUrl?: string | null;
 *   }) => void;
 *   isCheckingOut?: boolean;
 * }} props
 */
export function MerryPackageCard({
  id,
  name,
  price,
  priceLabel = "/Month",
  limitText,
  features,
  iconUrl = null,
  onChoosePackage,
  isCheckingOut = false,
}) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[24px] border border-gray-400 bg-white lg:min-w-[357px] lg:min-h-[438px]">
      <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-10">
        <div className="rounded-[16px] bg-gray-100 h-[60px] w-[60px] p-3 flex items-center justify-center">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              className="h-[36px] w-[36px] object-contain"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-headline3 text-purple-800">{name}</div>
          <div>
            <span className="text-body1 text-gray-900">THB </span>
            <span className="text-body1 text-gray-900">{price}</span>
            <span className="ml-1.5 text-body2 text-gray-600">{priceLabel}</span>
          </div>
        </div>

        <section
          aria-label={`${name} benefits`}
          className="flex flex-col gap-3 border-b border-gray-300 pb-6 lg:gap-4 lg:pb-9"
        >
          <div className="flex items-start gap-3">
            <img
              src="/merry_icon/icon-correct-purple.svg"
              alt=""
              aria-hidden
              className="mt-0.5 h-5 w-5"
            />
            <div className="text-body2 text-gray-800">{limitText}</div>
          </div>
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <img
                src="/merry_icon/icon-correct-purple.svg"
                alt=""
                aria-hidden
                className="mt-0.5 h-5 w-5"
              />
              <p className="text-body2 text-gray-800">{feature}</p>
            </div>
          ))}
        </section>

        <div>
          <PrimaryButton
            type="button"
            className="w-full py-[12px] px-[24px] bg-red-100 text-body2! font-bold text-red-600"
            disabled={isCheckingOut}
            onClick={() =>
              onChoosePackage?.({
                id,
                name,
                price,
                limitText,
                features,
                iconUrl: iconUrl ?? undefined,
              })
            }
          >
            {isCheckingOut ? "Loading…" : "Choose Package"}
          </PrimaryButton>
        </div>
      </div>
    </article>
  );
}

