import React, { forwardRef } from "react";
import Image from "next/image";

const InputBar = forwardRef(
  (
    {
      type = "text",
      placeholder = "",
      error = false,
      disabled = false,
      className = "",
      rightIcon = "",
      leftIcon = "",
      hideErrorIcon = false,
      inputClassName = "",
      ...props
    },
    ref
  ) => {
    const disabledStyle = "bg-gray-200 cursor-not-allowed opacity-60";

    return (
      <div className={`relative ${className}`}>
        {label && (
        <label className="block my-2 text-body2 font-medium text-black">
          {label}
        </label>
      )}
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            rounded-lg
            border
            py-3
            ${leftIcon ? "pl-13" : "px-4"}
            ${rightIcon || (error && !hideErrorIcon) ? "pr-10" : ""}
            border-gray-400
            outline-none
            focus:border-purple-500
            placeholder:text-gray-600
            ${error ? "border-utility-red" : ""}
            ${disabled ? disabledStyle : ""}
            ${inputClassName}
          `}
          {...props}
        />

        {/* Error Icon */}
        {error && !hideErrorIcon && (
          <Image
            src="/merry_icon/icon-exclamation.svg"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            alt=""
            width={16}
            height={16}
          />
        )}

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

InputBar.displayName = "InputBar";
export default InputBar;