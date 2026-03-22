import React from "react";

/**
 * Loading – ตัวแสดงสถานะกำลังโหลด ที่สามารถ custom สีและพื้นหลังได้
 *
 * Props:
 *  - colorClass: class ของสี icon + ข้อความ (เช่น "text-purple-700")
 *  - bgClass: class ของพื้นหลัง/กรอบ (เช่น "bg-white rounded-3xl shadow-lg")
 *  - className: class เพิ่มเติมของ container (เช่น width, padding)
 */
export function Loading({
  colorClass = "text-purple-700",
  bgClass = "",
  className = "",
}) {
  return (
    <div
      className={[
        "col-span-full flex flex-col items-center justify-center min-h-[300px]",
        bgClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        className={`w-[48px] h-[48px] ${colorClass}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
          opacity=".25"
        />
        <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur="0.75s"
            values="0 12 12;360 12 12"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      <h1 className={`text-2xl text-center ${colorClass}`}>Loading...</h1>
    </div>
  );
}
