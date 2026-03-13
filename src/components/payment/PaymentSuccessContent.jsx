import { PaymentSuccessCard } from "@/components/payment/PaymentSuccessCard";
import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";

/**
 * Unified responsive layout for Payment Success page (mobile + desktop).
 *
 * @param {{
 *  packageName: string;
 *  amount: string;
 *  currency: string;
 *  startDate: string;
 *  nextBillingDate: string;
 *  features: string[];
 *  iconVariant: "basic" | "platinum" | "premium";
 *  onBackToHome: () => void;
 *  onCheckMembership: () => void;
 * }} props
 */
export function PaymentSuccessContent({
  packageName,
  amount,
  currency,
  startDate,
  nextBillingDate,
  features,
  iconVariant,
  onBackToHome,
  onCheckMembership,
}) {
  return (
    <main
      className="flex flex-col mb-22 lg:h-[936px]"
      aria-label="Payment success"
    >
      <div className="flex flex-col justify-between gap-10 px-4 py-10 lg:flex-row lg:gap-0 lg:px-[163px] lg:py-0 2xl:px-[356px]">
        <section
          className="order-1 flex flex-col gap-[40px] w-full lg:order-0 lg:gap-[80px] lg:w-[641px] lg:h-[393px] lg:pt-[118px]"
          aria-label="Payment success message"
        >
          <header className="flex flex-col items-start text-start w-full max-w-md lg:max-w-none">
            <div className="w-[64px] h-[64px] lg:w-20 lg:h-20">
              <img
                src="/merry_icon/icon-payment-success.svg"
                alt="Payment success icon"
                className="w-full h-full"
              />
            </div>
            <div className="text-tagline font-semibold text-beige-700 py-2.5">
              PAYMENT SUCCESS
            </div>

            {/* Mobile message: multiline like the original */}
            <div className="text-headline3 text-purple-500 flex flex-col lg:hidden">
              <span>Welcome Merry</span>
              <span>Membership!</span>
              <span>Thank you for</span>
              <span>joining us</span>
            </div>

            {/* Desktop message: single block like the original */}
            <div className="hidden lg:block text-headline2 text-purple-500 pt-2">
              Welcome Merry Membership! Thank you for joining us
            </div>
          </header>

          <nav
            className="hidden lg:flex items-center gap-6 w-full"
            aria-label="Payment success actions"
          >
            <SecondaryButton
              type="button"
              onClick={onBackToHome}
              className="min-w-[150px] text-body2 font-bold text-red-600"
            >
              Back to home
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={onCheckMembership}
              className="min-w-[190px] text-body2 font-bold text-white"
            >
              Check Membership
            </PrimaryButton>
          </nav>
        </section>

        <section className="order-2 lg:order-0 lg:pt-[88px]" aria-label="Membership card">
          <PaymentSuccessCard
            packageName={packageName}
            amount={amount}
            currency={currency}
            startDate={startDate}
            nextBillingDate={nextBillingDate}
            features={features}
            iconVariant={iconVariant}
          />
        </section>
      </div>

      {/* Mobile actions: buttons under the card, like the original design */}
      <nav
        className="flex items-center gap-4 w-full px-4 pb-10 lg:hidden"
        aria-label="Payment success actions"
      >
        <SecondaryButton
          type="button"
          onClick={onBackToHome}
          className="flex-1 min-w-[150px] text-body2 font-bold text-red-600"
        >
          Back to home
        </SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={onCheckMembership}
          className="flex-1 min-w-[177px] text-body2 font-bold text-white"
        >
          Check Membership
        </PrimaryButton>
      </nav>
    </main>
  );
}

