// components/ui/InputDropdown.jsx
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const VISIBLE_ITEMS = 5;
const ITEM_HEIGHT_PX = 44;

const DropdownBar = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  error = false,
  disabled = false,
  searchable = false,
  hideErrorIcon = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const hasValue = value != null && String(value).trim() !== "";

  const filteredOptions =
    searchable && query.trim()
      ? options.filter((opt) =>
          String(opt).toLowerCase().includes(query.trim().toLowerCase())
        )
      : options;

  const displayValue = isOpen && searchable ? query : (value ?? "");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    if (searchable) setQuery(value ?? "");
  };

  const selectOption = (opt) => {
    onChange?.(opt);
    setIsOpen(false);
    if (searchable) setQuery("");
  };

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
          value={displayValue}
          readOnly={!searchable}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => searchable && setQuery(e.target.value)}
          onFocus={searchable ? openDropdown : undefined}
          className={`
            w-full px-4 py-3 border rounded-lg
            focus:border-purple-500 outline-none
            placeholder:text-gray-600
            ${error ? "border-red-500" : "border-gray-400"}
            ${hasValue && !isOpen ? "text-foreground" : "text-gray-600"}
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          `}
          onClick={() => !disabled && openDropdown()}
        />
        {error && !hideErrorIcon && (
          <Image
            src="/merry_icon/icon-exclamation.svg"
            className="absolute right-15 top-1/2 -translate-y-1/2 pointer-events-none"
            alt=""
            width={16}
            height={16}
          />
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && (searchable ? openDropdown() : setIsOpen((prev) => !prev))}
          className="absolute right-4 top-1/2 -translate-y-1/2 disabled:pointer-events-none"
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
        <div className="absolute mt-1 w-full border bg-white shadow-md rounded-lg z-10 overflow-hidden">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${VISIBLE_ITEMS * ITEM_HEIGHT_PX}px` }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-body2">
                No matches
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                  onClick={() => selectOption(opt)}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
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