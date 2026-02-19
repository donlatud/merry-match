// components/ui/InputDropdown.jsx
import { useState, useRef, useEffect } from "react";

const DropdownBar = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className="",
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
      <div className="relative">
        <input
          type="text"
          value={value}
          readOnly
          placeholder={placeholder}
          className="
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
          "
          onClick={() => setIsOpen((prev) => !prev)}
        />

        {/* ปุ่มสามเหลี่ยม */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <img
          src="/merry_icon/icon-arrow-drop-down.svg"
            size={18}
            className={`transition-transform text-gray-600 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute mt-1 w-full border bg-white shadow-md rounded-lg z-10">
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
//         options={["Apple", "Banana", "Orange"]} ใส่ ตัวเลือก
//         value={selected}
//         onChange={setSelected}
//         placeholder="Choose fruit" เปลี่ยน place holder
//     />