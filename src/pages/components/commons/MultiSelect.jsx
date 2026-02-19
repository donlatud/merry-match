// components/ui/MultiSelect.jsx
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

const MultiSelect = ({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const removeItem = (option) => {
    onChange(value.filter((item) => item !== option));
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block mb-2 text-body2 font-medium text-gray-600">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          min-h-14
          px-4
          py-3
          border
          border-gray-400
          rounded-lg
          flex
          flex-wrap
          gap-2
          items-center
          cursor-pointer
          focus-within:border-purple-500
          text-gray-600
          text-body2
          
        "
      >
        {value.length === 0 && (
          <span className="text-gray-600 **:text-body2">{placeholder}</span>
        )}

        {value.map((item) => (
          <div
            key={item}
            className="
              flex
              items-center
              gap-1
              bg-purple-100
              text-purple-700
              px-3
              py-1
              rounded-lg
              text-body2
            "
            onClick={(e) => e.stopPropagation()}
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="hover:text-purple-900 rounded-lg "
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="mt-1 w-full bg-white border shadow-md rounded-xl z-10">
          {options.map((option) => {
            const selected = value.includes(option);

            return (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 overflow-hidden text-gray-600${
                  selected ? "bg-purple-50 font-medium" : ""
                }`}
              >
                {option}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;

// example
//   const [multiSelected, setMultiSelected] = useState(["Selected"]);
//       <MultiSelect
//       options={["Apple", "Banana", "Orange"]} เปลี่ยนตัวเลือกที่นี่
//       value={multiSelected}
//       onChange={setMultiSelected}
//     />
