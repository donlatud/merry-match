import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";
import ExclamationIcon from "../../../../public/merry_icon/icon-exclamation.svg"

const InputBar = forwardRef(
  (
    {
      type = "text",
      placeholder = "",
      error = false,
      disabled = false,
      className = "",
      rightIcon="",
      ...props
    },
    ref
  ) => {
    const disabledStyle = "bg-gray-200 cursor-not-allowed opacity-60";

    return (
      <div className={`relative ${className}`}>
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            rounded-lg
            border
            px-4
            py-3
            pr-10
            border-gray-400
            outline-none
            focus:border-purple-500
            placeholder:text-gray-600
            ${error ? "border-utility-red" : ""}
            ${disabled ? disabledStyle : ""}
          `}
          {...props}
        />
        {error && (
        <img
          src="/merry_icon/icon-exclamation.svg"
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          alt="error"
        />
        )}

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
// example
//const [email, setEmail] = useState("")
      // <InputBar
      //   value={email}
      //   onChange={(e) => setEmail(e.target.value)}
      //   placeholder="Enter email"
      //   error={false} เงื่อนไขการ error true or false
      // />