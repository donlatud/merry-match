import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";

const MAX_LENGTH = 10;
const MAX_TAGS = 10;
const DEBOUNCE_DELAY = 300;

const MultiSelectTest = ({
  value = [],
  onChange,
  className,
  label,
  error,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]); // suggestions จาก API
  const [loading, setLoading] = useState(false);

  /*
  ------------------------------------------------
  Fetch suggestions จาก API (debounce)
  ------------------------------------------------
  - ใช้ fetch เพื่อ autocomplete tag
  - ไม่มีการ POST database ใน component นี้
  */

  useEffect(() => {
    const trimmed = inputValue.trim().toLowerCase();

    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/hobbies?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        const data = await res.json();

        // guard ป้องกัน API คืนค่า shape ผิด
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue]);

  /*
  ------------------------------------------------
  Filter suggestion
  ------------------------------------------------
  - prefix match
  - ไม่ให้ซ้ำกับ tag ที่เลือกแล้ว
  */

  const filteredSuggestions = useMemo(() => {
    const lowerInput = inputValue.toLowerCase();

    if (!Array.isArray(suggestions)) return [];

    return suggestions.filter((item) => {
      if (!item || typeof item.name !== "string") return false;

      return (
        item.name.toLowerCase().startsWith(lowerInput) &&
        !value.includes(item.name)
      );
    });
  }, [inputValue, suggestions, value]);

  /*
  ------------------------------------------------
  Add tag (สำคัญ)
  ------------------------------------------------
  - เพิ่มเข้า React state เท่านั้น
  - ไม่ POST database
  - database จะถูกเขียนตอน submit form
  */

  const addItem = (text) => {
    const trimmed = text.trim().toLowerCase();

    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) return;
    if (value.includes(trimmed)) return;
    if (value.length >= MAX_TAGS) return;

    // เพิ่ม tag เข้า state
    onChange([...value, trimmed]);

    // reset input
    setInputValue("");
  };

  /*
  ------------------------------------------------
  Remove tag
  ------------------------------------------------
  */

  const removeItem = (item) => {
    onChange(value.filter((v) => v !== item));
  };

  /*
  ------------------------------------------------
  Keyboard control
  ------------------------------------------------
  Enter = add tag
  Backspace = ลบ tag ล่าสุด
  */

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

      {/* input container */}
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
        {/* selected tags */}
        {value.map((item) => (
          <div
            key={item}
            className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-body2"
          >
            {item}

            {/* remove tag */}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="hover:text-purple-900 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* text input */}
        <input
          type="text"
          value={inputValue}
          maxLength={MAX_LENGTH}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 outline-none bg-transparent min-w-[120px] placeholder:text-gray-600"
        />
      </div>

      {/* suggestion dropdown */}
      {inputValue && filteredSuggestions.length > 0 && (
        <div className="border mt-1 rounded-lg bg-white shadow z-10">
          {filteredSuggestions.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-body2"
              onClick={() => addItem(item.name)}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}

      {/* loading indicator */}
      {loading && (
        <div className="mt-1 text-xs text-gray-500">
          loading suggestions...
        </div>
      )}
    </div>
  );
};

export default MultiSelectTest;