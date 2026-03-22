"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = "",
  error = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          h-full w-full rounded-lg border px-4 py-3 pr-12
          border-gray-400 outline-none focus:border-purple-500
          placeholder:text-gray-600
          disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60
          ${error ? "border-red-500" : ""}
        `}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 rounded p-1"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff size={20} aria-hidden />
        ) : (
          <Eye size={20} aria-hidden />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
