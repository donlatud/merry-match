export const IndicatorList = ({
  step,
  label,
  totalSteps = 3,
  isActive = false,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(step);
  };

  if (isActive) {
    // Mobile: fixed widths to match design; Desktop (lg+) still flexes
    const mobileWidthClass =
      step === 2 ? "w-[240px]" : "w-[215px]";

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex ${mobileWidthClass} cursor-pointer items-center gap-2 rounded-[16px] border border-purple-500 bg-utility-bg-main px-2 py-2 text-left shadow-button h-[56px] lg:w-auto lg:min-w-0 lg:flex-1 lg:px-4 lg:py-4 lg:h-[80px] transition hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2`}
        aria-current="step"
        aria-label={`Step ${step} of ${totalSteps}: ${label}. Current step.`}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gray-200 text-body3 font-extrabold text-purple-500">
          {step}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="whitespace-nowrap text-body5 text-gray-700">
            Step {step}/{totalSteps}
          </span>
          <span className="text-body3 font-extrabold whitespace-nowrap text-purple-500 ">
            {label}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex size-[56px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-gray-300 bg-utility-bg-main p-1.5 transition hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 lg:size-[80px] lg:rounded-[16px] lg:p-2"
    >
      <span className="flex size-10 items-center justify-center rounded-[8px] bg-gray-200 text-body4 font-extrabold text-gray-400 lg:size-12 lg:rounded-[12px] lg:text-body3">
        {step}
      </span>
    </button>
  );
};