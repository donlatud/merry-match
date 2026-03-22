import { IndicatorList } from "./IndicatorList";

const STEPS = [
  { step: 1, label: "Basic Information" },
  { step: 2, label: "Identities and Interests" },
  { step: 3, label: "Upload Photos" },
];

const TOTAL_STEPS = STEPS.length;

export const StepIndicator = ({ currentStep = 1, onStepClick }) => {
  return (
    <header className="lg:bg-utility-bg-main lg:pt-[30px] lg:px-[255px]">
      {/* Mobile: stack header + steps; Desktop (lg): title left, steps right, steps aligned with baseline of "matching" */}
      <div className="w-full flex flex-col px-[16px] pt-[40px] gap-[40px] lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 min-w-0 lg:flex-[0_0_auto]">
          <span className="text-beige-700 text-tagline font-semibold uppercase">
            REGISTER
          </span>
          <div className="text-headline3 font-bold text-purple-500 lg:text-headline2 lg:leading-tight lg:w-[453px]">
            Join us and start
            matching
          </div>
        </div>

        <div className="flex items-center gap-2 lg:shrink-0 lg:items-end lg:gap-4">
          {STEPS.map(({ step, label }) => (
            <IndicatorList
              key={step}
              step={step}
              label={label}
              totalSteps={TOTAL_STEPS}
              isActive={currentStep === step}
              onClick={onStepClick}
            />
          ))}
        </div>
      </div>
    </header>
  );
};