"use client";

import { toast } from "sonner";

export function Toast({
  t,
  title,
  description,
  icon,
  accentClass,
  progressClass,
  bgClass,
  borderClass,
  iconBgClass,
}) {
  return (
    <div
      className={`
        font-sans
        relative overflow-hidden
        flex items-center gap-3
        ${bgClass} ${borderClass} border
        rounded-2xl px-[18px] py-[14px]
        w-[calc(100vw-32px)] sm:w-[360px]
        shadow-[2px_2px_12px_0px_rgb(var(--purple-400)/0.25)]
        animate-in slide-in-from-right-4 duration-300
      `}
    >
      {/* Accent bar */}
      <div
        className={`absolute left-0 top-[16%] h-[68%] w-[3px] rounded-r-full bg-gradient-to-b ${accentClass}`}
      />

      {/* Icon */}
      <div
        className={`flex-shrink-0 w-[34px] h-[34px] rounded-full ${iconBgClass} flex items-center justify-center`}
      >
        <img src={icon} alt="" className="w-[18px] h-[18px]" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-body4 font-bold text-gray-900 tracking-tight leading-snug">
          {title}
        </p>
        {description && (
          <p className="text-body5 font-medium text-gray-600 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => toast.dismiss(t)}
        className={`
          flex-shrink-0 w-[22px] h-[22px] rounded-full
          ${iconBgClass} text-gray-600
          hover:bg-red-400 hover:text-white
          flex items-center justify-center
          transition-all duration-150 cursor-pointer
          text-[11px] font-bold
        `}
      >
        ✕
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full rounded-b-2xl overflow-hidden opacity-40">
        <div
          className={`h-full bg-gradient-to-r ${progressClass} animate-[shrink_4s_linear_forwards]`}
        />
      </div>
    </div>
  );
}
