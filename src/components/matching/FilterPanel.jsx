"use client";
// components/matching/FilterPanel.jsx
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { PrimaryButton } from "../commons/button/PrimaryButton";

const GENDER_OPTIONS = [
  { id: "Male", label: "Male" },
  { id: "Female", label: "Female" },
  { id: "Non-binary", label: "Non-binary people" },
];

const AGE_MIN = 18;
const AGE_MAX = 80;

export default function FilterPanel({ onSearch }) {
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [ageRange, setAgeRange] = useState([18, 50]);

  const handleGenderChange = (id, checked) => {
    setSelectedGenders((prev) =>
      checked ? [...prev, id] : prev.filter((g) => g !== id)
    );
  };

  const handleClear = () => {
    setSelectedGenders([]);
    setAgeRange([18, 50]);
  };

  const handleSearch = () => {
    onSearch?.({ genders: selectedGenders, ageRange });
  };

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Gender */}
      <div>
        <p className="text-body4 font-bold text-gray-900 mb-4">
          Gender you interest
        </p>
        <div className="flex flex-col gap-3">
          {GENDER_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                id={`panel-${option.id}`}
                checked={selectedGenders.includes(option.id)}
                onCheckedChange={(checked) =>
                  handleGenderChange(option.id, checked)
                }
                className="
                  w-5 h-5 rounded
                  border-gray-300
                  data-[state=checked]:bg-purple-500
                  data-[state=checked]:border-purple-500
                "
              />
              <span className="text-body4 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Age Range */}
      <div>
        <p className="text-body4 font-bold text-gray-900 mb-5">Age Range</p>
        <Slider
          min={AGE_MIN}
          max={AGE_MAX}
          step={1}
          value={ageRange}
          onValueChange={setAgeRange}
          className="mb-5
            **:[[role=slider]]:w-4
            **:[[role=slider]]:h-4
            **:[[role=slider]]:bg-purple-300
            **:[[role=slider]]:border-2
            **:[[role=slider]]:border-purple-500
            [&>span:first-child]:h-0.5
            [&>span:first-child>span]:bg-purple-500
            [&>span:first-child]:bg-gray-200"
        />
        <div className="flex items-center gap-3">
          <div className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-body4 font-medium text-gray-700 bg-gray-50">
            {ageRange[0]}
          </div>
          <span className="text-gray-400 font-medium">-</span>
          <div className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-body4 font-medium text-gray-700 bg-gray-50">
            {ageRange[1]}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleClear}
          className="text-body4 font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          Clear
        </button>
        <PrimaryButton onClick={handleSearch} className="flex-1 cursor-pointer">
          Search
        </PrimaryButton>
      </div>

    </div>
  );
}