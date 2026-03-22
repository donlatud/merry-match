import { PrimaryButton } from "@/components/commons/button/PrimaryButton";

/**
 * Unified responsive layout for Payment Failed page (mobile + desktop).
 *
 * @param {{
 *  description: string;
 *  onRetry: () => void;
 *  onBackToPackages: () => void;
 * }} props
 */
export function PaymentFailedContent({
  description,
  onRetry,
  onBackToPackages,
}) {
  return (
    <main aria-label="Payment Failed">
      <div className="flex flex-col lg:pt-[80px] lg:px-[351px] lg:gap-10">
        <section
          aria-labelledby="payment-failed-heading"
          className="flex flex-col items-center justify-center gap-6 w-full bg-purple-100 h-[594px] py-[88px] px-[24px] lg:h-[349px] lg:py-[64px]"
        >
          <div>
            <img
              src="/merry_icon/icon-payment-fail.svg"
              alt="Payment failed icon"
              className="w-13 h-13 lg:w-16 lg:h-16"
            />
          </div>

          <header className="flex flex-col items-center justify-center gap-3 lg:w-[738px] lg:h-[109px]">
            <h1
              id="payment-failed-heading"
              className="text-headline3 text-purple-600 text-center"
            >
              Payment Failed
            </h1>
            <p className="text-body2 text-purple-500 text-center max-w-[480px]">
              {description}
            </p>
          </header>
        </section>

        <nav
          className="flex flex-col items-center justify-center gap-6 w-full h-[170px] py-9 px-6 lg:flex-row lg:gap-10 lg:py-0 lg:px-0"
          aria-label="Payment failed actions"
        >
          <PrimaryButton
            type="button"
            onClick={onRetry}
            className="w-full bg-purple-600 text-white lg:min-w-[250px] lg:w-auto"
          >
            Try Again
          </PrimaryButton>

          <button
            type="button"
            onClick={onBackToPackages}
            className="text-body2 text-purple-500 lg:min-w-[171px]"
          >
            Back to packages
          </button>
        </nav>
      </div>
    </main>
  );
}

