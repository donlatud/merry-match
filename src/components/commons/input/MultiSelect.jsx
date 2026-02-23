// components/commons/MultiSelect.jsx
import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

const MAX_LENGTH = 10;

const MultiSelect = ({
  label,
  value = [],
  onChange,
  placeholder = "Type and press Enter",
  className = "",
  error = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const addItem = (text) => {
    const trimmed = text.trim();

    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) return;
    if (value.includes(trimmed)) return;

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeItem = (item) => {
    onChange(value.filter((v) => v !== item));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(inputValue);
    }

    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeItem(value[value.length - 1]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block my-2 text-body2 font-medium text-black">
          {label}
        </label>
      )}

    <div
      className={`
        relative
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
        focus-within:border-purple-500
        ${error ? "border-utility-red" : ""}
        `}
      >
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
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="hover:text-purple-900 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          maxLength={MAX_LENGTH}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 outline-none bg-transparent min-w-[120px] placeholder:text-gray-600"
        />
        {error && (
          <Image
            src="/merry_icon/icon-exclamation.svg"
            className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"
            alt="error"
            width={16}
            height={16}
            />
        )}
                
      </div>

      <div className="mt-1 text-xs text-gray-500">
        {inputValue.length}/{MAX_LENGTH} characters
      </div>
      
    </div>
  );
};

export default MultiSelect;

//example

// const [tags, setTags] = useState([]);

// <MultiSelect
//   label="Keywords"
//   placeholder="placeholder"
//   value={tags}
//   onChange={setTags}
// />