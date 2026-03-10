import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Image from "next/image";

const MAX_LENGTH = 10;
const MAX_TAGS = 10;
const DEBOUNCE_DELAY = 300;

const MultiSelect = ({
  value = [],
  onChange,
  className,
  label,
  error,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]); // 🔒 default เป็น array เสมอ
  const [loading, setLoading] = useState(false);

  // 🔎 Fetch suggest ทุกครั้งที่พิมพ์ (debounce)
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

        // 🔒 กัน API คืนค่าผิด shape
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

  // -------- Filter --------
  const filteredSuggestions = useMemo(() => {
    const lowerInput = inputValue.toLowerCase();

    // 🔒 กัน suggestions เป็น undefined
    if (!Array.isArray(suggestions)) return [];

    return suggestions.filter((item) => {
      // 🔒 guard ป้องกัน undefined
      if (!item || typeof item.name !== "string") return false;

      return (
        item.name.toLowerCase().startsWith(lowerInput) && // prefix match
        !value.includes(item.name)
      );
    });
  }, [inputValue, suggestions, value]);

  // -------- Add --------
  const addItem = async (text) => {
    const trimmed = text.trim().toLowerCase();

    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) return;
    if (value.includes(trimmed)) return;
    if (value.length >= MAX_TAGS) return;

    const exists = suggestions.find(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.toLowerCase() === trimmed
    );

    // ถ้ามีในระบบแล้ว
    if (exists) {
      onChange([...value, exists.name]);
      setInputValue("");
      return;
    }

    // ถ้าไม่มี → สร้างใหม่
    try {
      setLoading(true);

      const res = await fetch("/api/hobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const newTag = await res.json();

      // 🔒 validate response ก่อนใช้
      if (newTag && typeof newTag.name === "string") {
        setSuggestions((prev) => [...prev, newTag]);
        onChange([...value, newTag.name]);
      }

      setInputValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    
        {value.map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-body2"
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
      </div>

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

      {loading && (
        <div className="mt-1 text-xs text-gray-500">
          creating tag...
        </div>
      )}

    </div>
  );
};

export default MultiSelect;