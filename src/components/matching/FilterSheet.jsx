"use client";
// components/matching/FilterSheet.jsx
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

export default function FilterSheet({ open, onOpenChange, onSearch }) {
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [ageRange, setAgeRange] = useState([18, 50]);

  const handleGenderChange = (id, checked) => {
    setSelectedGenders((prev) =>
      checked ? [...prev, id] : prev.filter((g) => g !== id),
    );
  };

  const handleClear = () => {
    setSelectedGenders([]);
    setAgeRange([18, 50]);
  };

  const handleSearch = () => {
    onSearch?.({ genders: selectedGenders, ageRange });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="
          rounded-t-3xl px-6 pt-6 pb-8
          font-sans
          max-h-[85vh]
          bg-white
        "
      >
        {/* Header */}
        <SheetHeader className="mb-6 p-0">
          <SheetDescription className="sr-only">
            Filter matching preferences
          </SheetDescription>
          <div className="flex items-center justify-between">
            {/* Close */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <img
                src="/merry_icon/icon-close.svg"
                alt="close"
                className="w-5 h-5"
              />
            </button>

            {/* Title */}
            <SheetTitle className="text-body1 font-bold text-purple-800 absolute left-1/2 -translate-x-1/2">
              Filter
            </SheetTitle>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="text-body4 font-semibold text-red-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </SheetHeader>

        {/* Gender */}
        <div className="mb-8">
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
                  id={option.id}
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

        {/* Age Range */}
        <div className="mb-10">
          <p className="text-body4 font-bold text-gray-900 mb-5">Age Range</p>

          {/* Slider */}
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

          {/* Input boxes */}
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

        {/* Search Button */}
        <PrimaryButton onClick={handleSearch}>Search</PrimaryButton>
      </SheetContent>
    </Sheet>
  );
}
