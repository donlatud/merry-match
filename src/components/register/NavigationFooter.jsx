import { GhostButton } from "@/components/commons/button/GhostButton";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";

export const NavigationFooter = ({
  currentStep = 1,
  totalSteps = 3,
  isSubmitting = false,
  onBack,
  onNext,
  onConfirm,
}) => {
  const isStep1 = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const handlePrimary = isLastStep && onConfirm ? onConfirm : onNext;

  return (
    <footer className="h-[112px] border-t border-gray-300 bg-white px-4 py-8 flex items-center lg:h-[112px] lg:px-[160px] lg:py-[32px] lg:flex lg:items-center lg:justify-between lg:shrink-0">
      <nav
        className="flex w-full flex-wrap items-center justify-between gap-4"
        aria-label="Registration step navigation"
      >
        <span className="text-body2 text-gray-600">
          <span className="font-medium text-gray-700">{currentStep}</span>
          <span>/</span>
          <span>{totalSteps}</span>
        </span>

        <div className="flex items-center gap-6">
          <GhostButton
            type="button"
            disabled={isStep1 || isSubmitting}
            onClick={onBack}
            className="w-auto min-w-0 cursor-pointer text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-400"
            aria-label="Go back to previous step"
          >
            Back
          </GhostButton>

          <PrimaryButton
            type="button"
            onClick={handlePrimary}
            disabled={isSubmitting}
            aria-label={isLastStep ? (isSubmitting ? "Submitting" : "Confirm") : "Go to next step"}
            className={`cursor-pointer ${isLastStep ? "w-[107px]" : "w-[120px]"}`}
          >
            {isLastStep && isSubmitting ? "Loading..." : isLastStep ? "Confirm" : "Next step"}
          </PrimaryButton>
        </div>
      </nav>
    </footer>
  );
};
