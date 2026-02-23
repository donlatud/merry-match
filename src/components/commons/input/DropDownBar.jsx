// components/ui/InputDropdown.jsx
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const DropdownBar = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className="",
  error=false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // ปิดเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
              {label && (
        <label className="block my-2 text-body2 font-medium text-black">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          readOnly
          placeholder={placeholder}
          className={`
                        w-full
            px-4
            py-3
            border
            border-gray-400
            rounded-lg
            focus:border-purple-500
            outline-none  
            cursor-pointer
            placeholder:text-gray-600
            ${error ? "border-utility-red" : ""}
            `}
          onClick={() => setIsOpen((prev) => !prev)}
        />
        {/* error */}
        {error && (
        <Image
          src="/merry_icon/icon-exclamation.svg"
          className="absolute right-15 top-1/2 -translate-y-1/2 pointer-events-none"
          alt="error"
          width={16}
          height={16}
          />
        )}
        {/* ปุ่มสามเหลี่ยม */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <Image
          src="/merry_icon/icon-arrow-drop-down.svg"
          alt="arrow-down"
          width={20}
          height={20}
            size={18}
            className={`transition-transform text-gray-600 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute mt-1 w-full border bg-white shadow-md rounded-lg z-10 overflow-clip">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700"
              onClick={() => {
                onChange?.(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownBar;

// example
//   const [selected, setSelected] = useState("");
//         <DropdownBar
//          label=""
//         options={["Apple", "Banana", "Orange"]} ใส่ ตัวเลือก
//         value={selected}
//         onChange={setSelected}
//         placeholder="Choose fruit" เปลี่ยน place holder
//         error={false}
//     />