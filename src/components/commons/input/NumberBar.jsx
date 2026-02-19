// components/ui/NumberBar.jsx

const NumberBar = ({
  value = 0,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder = "Enter number",
  className = "",
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
    <div className={`relative ${className}`}>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className="
          w-full
          px-4
          py-3
          border
          border-gray-400
          rounded-lg
          focus:border-purple-500
          outline-none
          placeholder:text-gray-600
        "
      />

      {/* Spinner arrows */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center pr-2 gap-0">
        <button
          type="button"
          onClick={increase}
          className="flex items-center justify-center h-3"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-gray-600" />
        </button>

        <button
          type="button"
          onClick={decrease}
          className="flex items-center justify-center h-3"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default NumberBar;

// example
//  const [count, setCount] = useState(0);
//      <NumberBar
//        value={count} นำcount ไปใช้
//        onChange={setCount}
//        min={0} 
//        max={100}
//        step={1}
//      />