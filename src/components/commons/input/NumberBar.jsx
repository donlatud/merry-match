// components/ui/NumberBar.jsx
import Image from "next/image";
import { fa } from "zod/v4/locales";

const NumberBar = ({
  label,
  value = 0,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder = "Enter number",
  className = "",
  error= false,
}) => {
  const increase = () => {
    const newValue = Number(value) + step;
    if (newValue <= max) onChange?.(newValue);
  };

  const decrease = () => {
    const newValue = Number(value) - step;
    if (newValue >= min) onChange?.(newValue);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "") return onChange?.("");
    const num = Number(val);
    if (!isNaN(num)) onChange?.(num);
  };

  return (
    <div className={`w-full ${className}`}>
            {label && (
        <label className="block my-2 text-body2 font-medium text-black">
          {label}
        </label>
      )}
      <div className="relative">
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className={`
          w-full
          px-4
          py-3
          border
          border-gray-400
          rounded-lg
          focus:border-purple-500
          outline-none
          placeholder:text-gray-600
          pr-14
          ${error ? "border-utility-red" : ""}
        `}
      />
              {error && (
                <Image
                  src="/merry_icon/icon-exclamation.svg"
                  className="absolute right-15 top-1/2 -translate-y-1/2 pointer-events-none"
                  alt="error"
                  width={16}
                  height={16}
                  />
              )}
                   
      {/* Spinner arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center pr-2 gap-0">
        <button
          type="button"
          onClick={increase}
          className="flex items-center justify-center h-3 cursor-pointer"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-gray-600" />
        </button>

        <button
          type="button"
          onClick={decrease}
          className="flex items-center justify-center h-3 cursor-pointer"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-gray-600" />
        </button>
        
      </div>
    </div>
    </div>
  );
};

export default NumberBar;

// example
//  const [count, setCount] = useState(0);
//      <NumberBar
//.       label=""
//        value={count} นำcount ไปใช้
//        onChange={setCount}
//        min={0} 
//        max={100}
//        step={1}
//.       error={false}
//      />